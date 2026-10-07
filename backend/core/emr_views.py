from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .emr_serializers import DemoEMRNoteInputSerializer, DemoEMRNoteSerializer, DemoEMRPatientSerializer
from .emr_workflow_serializers import DemoEMRAssessmentSerializer, DemoEMRPatientCreateSerializer
from .models import DemoEMRNote, DemoEMRPatient, User


class DemoEMRPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in (User.Role.STAFF, User.Role.OWNER, User.Role.ADMIN)


class DemoEMRView(APIView):
    permission_classes = (permissions.IsAuthenticated, DemoEMRPermission)

    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)
        response["Cache-Control"] = "private, no-store"
        return response


class DemoEMRPatientListView(DemoEMRView):
    def get(self, request):
        patients = DemoEMRPatient.objects.all()
        if request.query_params.get("include_removed") != "true":
            patients = patients.filter(is_active=True)
        return Response(DemoEMRPatientSerializer(patients, many=True).data)

    @transaction.atomic
    def post(self, request):
        serializer = DemoEMRPatientCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        client_id = data.pop("client_id")
        patient, created = DemoEMRPatient.objects.get_or_create(
            client_id=client_id, defaults={"chart_number": "EMR-" + client_id.hex[:16].upper(), **data},
        )
        if not created and any(getattr(patient, key) != value for key, value in data.items()):
            return Response({"detail": "This patient reference has been saved already. Refresh the patient list."}, status=409)
        return Response(DemoEMRPatientSerializer(patient).data, status=201 if created else 200)


class DemoEMRChartView(DemoEMRView):
    def get(self, request, patient_id):
        patient = get_object_or_404(DemoEMRPatient, pk=patient_id)
        return Response({
            "patient": DemoEMRPatientSerializer(patient).data,
            "notes": DemoEMRNoteSerializer(patient.notes.all(), many=True).data,
            "assessments": DemoEMRAssessmentSerializer(patient.assessments.all(), many=True).data,
        })


class DemoEMRNoteCreateView(DemoEMRView):
    @transaction.atomic
    def post(self, request, patient_id):
        patient = get_object_or_404(DemoEMRPatient.objects.select_for_update(), pk=patient_id)
        if not patient.is_active:
            return Response({"detail": "Restore this patient before recording new chart entries."}, status=409)
        serializer = DemoEMRNoteInputSerializer(data=request.data, context={"patient": patient})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        client_id = data.pop("client_id", None)
        if client_id is None:
            return Response({"detail": "A note reference is required."}, status=400)
        data.pop("revision", None)
        parent_id = data.pop("amendment_of", None)
        parent = None
        if parent_id:
            parent = get_object_or_404(DemoEMRNote, pk=parent_id, patient=patient, status=DemoEMRNote.Status.FINAL)
        defaults = dict(
            patient=patient, author=request.user,
            author_name=request.user.get_full_name()[:200], amendment_of=parent,
            finalized_by=request.user if data["status"] == DemoEMRNote.Status.FINAL else None,
            finalized_by_name=request.user.get_full_name()[:200] if data["status"] == DemoEMRNote.Status.FINAL else "",
            finalized_at=timezone.now() if data["status"] == DemoEMRNote.Status.FINAL else None,
            **data,
        )
        note, created = DemoEMRNote.objects.get_or_create(client_id=client_id, defaults=defaults)
        if not created:
            if note.patient_id != patient.id or note.author_id != request.user.id or note.amendment_of_id != parent_id or any(getattr(note, key) != value for key, value in data.items()):
                return Response({"detail": "This note reference has been saved already. Reload the chart."}, status=409)
        return Response(DemoEMRNoteSerializer(note).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class DemoEMRNoteUpdateView(DemoEMRView):
    @transaction.atomic
    def patch(self, request, note_id):
        note = get_object_or_404(DemoEMRNote.objects.select_for_update().select_related("patient"), pk=note_id)
        if not note.patient.is_active:
            return Response({"detail": "Restore this patient before updating chart entries."}, status=409)
        if note.status == DemoEMRNote.Status.FINAL:
            return Response({"detail": "This note is finalized. Add an amendment to record a correction."}, status=409)
        if note.author_id != request.user.id and request.user.role not in (User.Role.OWNER, User.Role.ADMIN):
            return Response({"detail": "Only the author or an administrator can update this draft."}, status=403)
        serializer = DemoEMRNoteInputSerializer(data=request.data, context={"patient": note.patient})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        if "client_id" in data and data.pop("client_id") != note.client_id:
            return Response({"detail": "The note reference cannot be changed."}, status=400)
        if data.pop("revision", None) != note.revision:
            return Response({"detail": "This draft was updated elsewhere. Reload the chart before saving."}, status=409)
        if "amendment_of" in data and data.pop("amendment_of") != note.amendment_of_id:
            return Response({"detail": "The original note for an amendment cannot be changed."}, status=400)
        for field, value in data.items():
            setattr(note, field, value)
        note.revision += 1
        if note.status == DemoEMRNote.Status.FINAL:
            note.finalized_at = timezone.now()
            note.finalized_by = request.user
            note.finalized_by_name = request.user.get_full_name()[:200]
        note.save()
        return Response(DemoEMRNoteSerializer(note).data)
