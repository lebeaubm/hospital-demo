from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.exceptions import APIException
from rest_framework.response import Response

from .emr_serializers import DemoEMRPatientSerializer
from .emr_views import DemoEMRView
from .emr_workflow_serializers import (
    DemoEMRAssessmentInputSerializer, DemoEMRAssessmentSerializer,
    DemoEMRPatientStatusSerializer, DemoEMRTaskInputSerializer,
    DemoEMRTaskSerializer, DemoEMRTaskStatusSerializer,
    DemoEMRVisitInputSerializer, DemoEMRVisitSerializer, DemoEMRVisitStatusSerializer,
)
from .models import DemoEMRAssessment, DemoEMRPatient, DemoEMRTask, DemoEMRVisit, User


class WorkflowConflict(APIException):
    status_code = 409
    default_detail = "This record changed. Refresh before saving again."


def staff_name(user):
    return (user.get_full_name() or "Staff Member")[:200]


def active_patient(patient_id):
    patient = get_object_or_404(DemoEMRPatient.objects.select_for_update(), pk=patient_id)
    if not patient.is_active:
        raise WorkflowConflict("Restore this patient before adding or updating work.")
    return patient


def create_once(model, data, actor, output_serializer, actor_field="created_by"):
    client_id = data.pop("client_id")
    record, created = model.objects.get_or_create(client_id=client_id, defaults={**data, actor_field: actor})
    if not created and (getattr(record, actor_field + "_id") != actor.id or any(getattr(record, key) != value for key, value in data.items())):
        raise WorkflowConflict("This entry has been saved already. Refresh before trying again.")
    return Response(output_serializer(record).data, status=201 if created else 200)


class DemoEMRPatientStatusView(DemoEMRView):
    @transaction.atomic
    def patch(self, request, patient_id):
        patient = get_object_or_404(DemoEMRPatient.objects.select_for_update(), pk=patient_id)
        serializer = DemoEMRPatientStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        if data["revision"] != patient.revision:
            raise WorkflowConflict()
        if patient.is_active != data["is_active"]:
            patient.is_active = data["is_active"]
            patient.removed_at = None if patient.is_active else timezone.now()
            patient.removed_by_name = "" if patient.is_active else staff_name(request.user)
            patient.revision += 1
            patient.save()
        return Response(DemoEMRPatientSerializer(patient).data)


class DemoEMRAssessmentCreateView(DemoEMRView):
    @transaction.atomic
    def post(self, request, patient_id):
        patient = active_patient(patient_id)
        serializer = DemoEMRAssessmentInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return create_once(DemoEMRAssessment, {
            **serializer.validated_data, "patient": patient, "author_name": staff_name(request.user),
        }, request.user, DemoEMRAssessmentSerializer, "author")


class DemoEMRDashboardView(DemoEMRView):
    def get(self, request):
        staff = User.objects.filter(role__in=(User.Role.STAFF, User.Role.ADMIN), is_active=True).order_by("first_name", "last_name", "id")
        return Response({
            "staff": [{"id": person.id, "name": staff_name(person)} for person in staff],
            "visits": DemoEMRVisitSerializer(DemoEMRVisit.objects.filter(patient__is_active=True).select_related("patient"), many=True).data,
            "tasks": DemoEMRTaskSerializer(DemoEMRTask.objects.filter(patient__is_active=True).select_related("patient"), many=True).data,
        })


class DemoEMRVisitCreateView(DemoEMRView):
    @transaction.atomic
    def post(self, request):
        serializer = DemoEMRVisitInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        data["patient"] = active_patient(data["patient"].id)
        data["assigned_name"] = staff_name(data["assigned_to"]) if data["assigned_to"] else ""
        data["created_by_name"] = staff_name(request.user)
        return create_once(DemoEMRVisit, data, request.user, DemoEMRVisitSerializer)


class DemoEMRTaskCreateView(DemoEMRView):
    @transaction.atomic
    def post(self, request):
        serializer = DemoEMRTaskInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        data["patient"] = active_patient(data["patient"].id)
        if data["visit"]:
            visit = get_object_or_404(DemoEMRVisit.objects.select_for_update(), pk=data["visit"].id)
            if visit.status not in ("SCHEDULED", "IN_PROGRESS"):
                raise WorkflowConflict("Select an unfinished visit for this task.")
            data["visit"] = visit
        data["assigned_name"] = staff_name(data["assigned_to"]) if data["assigned_to"] else ""
        data["created_by_name"] = staff_name(request.user)
        return create_once(DemoEMRTask, data, request.user, DemoEMRTaskSerializer)


class DemoEMRVisitStatusView(DemoEMRView):
    @transaction.atomic
    def patch(self, request, visit_id):
        original = get_object_or_404(DemoEMRVisit, pk=visit_id)
        active_patient(original.patient_id)
        visit = get_object_or_404(DemoEMRVisit.objects.select_for_update(), pk=visit_id)
        serializer = DemoEMRVisitStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        if data["revision"] != visit.revision:
            raise WorkflowConflict()
        transitions = {
            "SCHEDULED": {"IN_PROGRESS", "CANCELLED"},
            "IN_PROGRESS": {"COMPLETED", "CANCELLED"},
            "COMPLETED": {"IN_PROGRESS"}, "CANCELLED": {"SCHEDULED"},
        }
        if data["status"] != visit.status:
            if data["status"] not in transitions[visit.status]:
                raise WorkflowConflict("Start the visit before completing it.")
            if data["status"] == "COMPLETED" and visit.tasks.filter(status="OPEN").exists():
                raise WorkflowConflict("Complete this visit's open tasks before finishing the visit.")
            visit.status = data["status"]
            visit.completed_at = timezone.now() if visit.status == "COMPLETED" else None
            visit.updated_by_name = staff_name(request.user)
            visit.revision += 1
            visit.save()
        return Response(DemoEMRVisitSerializer(visit).data)


class DemoEMRTaskStatusView(DemoEMRView):
    @transaction.atomic
    def patch(self, request, task_id):
        original = get_object_or_404(DemoEMRTask, pk=task_id)
        active_patient(original.patient_id)
        task = get_object_or_404(DemoEMRTask.objects.select_for_update(), pk=task_id)
        serializer = DemoEMRTaskStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        if data["revision"] != task.revision:
            raise WorkflowConflict()
        if task.status != data["status"]:
            if data["status"] == "OPEN" and task.visit_id and task.visit.status == "COMPLETED":
                raise WorkflowConflict("Reopen the completed visit before reopening its task.")
            task.status = data["status"]
            task.completed_at = timezone.now() if task.status == "DONE" else None
            task.completed_by_name = staff_name(request.user) if task.status == "DONE" else ""
            task.revision += 1
            task.save()
        return Response(DemoEMRTaskSerializer(task).data)
