from django.urls import path

from .views import (
    APIRootView,
    AppointmentCreateView,
    StaffPatientListView,
    StaffUserListView,
    AppointmentDetailView,
    BillPaymentCreateView,
    DoctorDetailView,
    DoctorListView,
    DocumentDownloadView,
    LabTestListView,
    LoginView,
    MessageCreateView,
    MessageThreadDetailView,
    MyAppointmentListView,
    PatientBillDetailView,
    PatientBillListView,
    PatientDocumentUploadView,
    PatientFamilyMemberCreateView,
    PatientFamilyMemberDetailView,
    PatientFamilyMemberListView,
    PatientLabOrderDetailView,
    PatientLabOrderListView,
    PatientMedicalRecordView,
    PatientMeView,
    PatientMessageThreadCreateView,
    PatientMessageThreadListView,
    PatientPrescriptionDetailView,
    PatientPrescriptionListView,
    PatientRefillListView,
    PharmacyListView,
    PrescriptionRefillCreateView,
    RefreshView,
    RegisterView,
    StaffAppointmentListView,
    StaffAppointmentUpdateView,
    StaffBillCreateView,
    StaffBillLineItemCreateView,
    StaffBillListView,
    StaffBillUpdateView,
    StaffDocumentDeleteView,
    StaffEmailLogDetailView,
    StaffEmailLogListView,
    StaffFamilyMemberListView,
    StaffLabOrderCreateView,
    StaffLabOrderListView,
    StaffLabOrderUpdateView,
    StaffLabResultCreateView,
    StaffLabResultUpdateView,
    StaffLabResultValueCreateView,
    StaffMeView,
    StaffMessageThreadListView,
    StaffMessageThreadUpdateView,
    StaffNoteVisibilityView,
    StaffPatientDocumentsView,
    StaffPatientNotesView,
    StaffPatientRecordView,
    StaffPrescriptionCreateView,
    StaffPrescriptionListView,
    StaffPrescriptionUpdateView,
    StaffRefillListView,
    StaffRefillUpdateView,
    StaffSendEmailView,
    BillableServiceListView,
    PatientMyDoctorsView,
    StaffAllDoctorsView,
    StaffPatientAssignedDoctorsView,
    StaffPatientRemoveAssignedDoctorView,
    AdminUserListView,
    AdminUserRoleUpdateView,
)
from .payment_views import (
    CreateCheckoutSessionView,
    stripe_webhook,
    verify_payment,
    payment_history,
    download_invoice,
)

urlpatterns = [
    path("", APIRootView.as_view(), name="api_root"),
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/refresh/", RefreshView.as_view(), name="token_refresh"),
    path("doctors/", DoctorListView.as_view(), name="doctor_list"),
    path("doctors/<int:pk>/", DoctorDetailView.as_view(), name="doctor_detail"),
    path("patients/me/", PatientMeView.as_view(), name="patient_me"),
    path("staff/me/", StaffMeView.as_view(), name="staff_me"),
    path("appointments/", AppointmentCreateView.as_view(), name="appointment_create"),
    path("appointments/my/", MyAppointmentListView.as_view(), name="appointment_list"),
    path("appointments/<int:pk>/", AppointmentDetailView.as_view(), name="appointment_detail"),
    path("staff/appointments/", StaffAppointmentListView.as_view(), name="staff_appointment_list"),
    path(
        "staff/appointments/<int:pk>/",
        StaffAppointmentUpdateView.as_view(),
        name="staff_appointment_update",
    ),
    path("staff/emails/", StaffEmailLogListView.as_view(), name="staff_email_log_list"),
    path("staff/emails/<int:pk>/", StaffEmailLogDetailView.as_view(), name="staff_email_log_detail"),
    path("staff/emails/send/", StaffSendEmailView.as_view(), name="staff_send_email"),
    # Medical Records - Patient endpoints
    path("records/me/", PatientMedicalRecordView.as_view(), name="patient_medical_record"),
    path("records/me/documents/", PatientDocumentUploadView.as_view(), name="patient_document_upload"),
    # Medical Records - Staff endpoints
    path("staff/patients/<int:patient_id>/record/", StaffPatientRecordView.as_view(), name="staff_patient_record"),
    path("staff/patients/<int:patient_id>/notes/", StaffPatientNotesView.as_view(), name="staff_patient_notes"),
    path("staff/patients/<int:patient_id>/documents/", StaffPatientDocumentsView.as_view(), name="staff_patient_documents"),
    path("staff/notes/<int:note_id>/", StaffNoteVisibilityView.as_view(), name="staff_note_visibility"),
    path("staff/documents/<int:document_id>/", StaffDocumentDeleteView.as_view(), name="staff_document_delete"),
    # Document download (secure, permission-checked)
    path("documents/<int:document_id>/download/", DocumentDownloadView.as_view(), name="document_download"),
    # Payment endpoints
    path("payments/checkout-session/", CreateCheckoutSessionView.as_view(), name="create_checkout_session"),
    path("payments/webhook/", stripe_webhook, name="stripe_webhook"),
    path("payments/verify/", verify_payment, name="verify_payment"),
    path("payments/my/", payment_history, name="payment_history"),
    path("payments/<int:payment_id>/invoice/", download_invoice, name="download_invoice"),
    
    # ==================== PRESCRIPTION URLS ====================
    path("pharmacies/", PharmacyListView.as_view(), name="pharmacy_list"),
    # Patient prescription endpoints
    path("prescriptions/me/", PatientPrescriptionListView.as_view(), name="patient_prescription_list"),
    path("prescriptions/<int:pk>/", PatientPrescriptionDetailView.as_view(), name="prescription_detail"),
    path("prescriptions/<int:prescription_id>/refill/", PrescriptionRefillCreateView.as_view(), name="prescription_refill"),
    path("prescriptions/refills/me/", PatientRefillListView.as_view(), name="patient_refill_list"),
    # Staff prescription endpoints
    path("staff/prescriptions/", StaffPrescriptionListView.as_view(), name="staff_prescription_list"),
    path("staff/prescriptions/create/", StaffPrescriptionCreateView.as_view(), name="staff_prescription_create"),
    path("staff/prescriptions/<int:pk>/", StaffPrescriptionUpdateView.as_view(), name="staff_prescription_update"),
    path("staff/refills/", StaffRefillListView.as_view(), name="staff_refill_list"),
    path("staff/refills/<int:pk>/", StaffRefillUpdateView.as_view(), name="staff_refill_update"),
    
    # Staff user list (for patient message recipient selection)
    path("staff-users/", StaffUserListView.as_view(), name="staff_user_list"),
    path("staff/patients/", StaffPatientListView.as_view(), name="staff_patient_list"),

    # ==================== DOCTOR ASSIGNMENT URLS ====================
    path("my-doctors/", PatientMyDoctorsView.as_view(), name="my_doctors"),
    path("staff/all-doctors/", StaffAllDoctorsView.as_view(), name="staff_all_doctors"),
    path("staff/patients/<int:patient_id>/assigned-doctors/", StaffPatientAssignedDoctorsView.as_view(), name="staff_patient_assigned_doctors"),
    path("staff/patients/<int:patient_id>/assigned-doctors/<int:doctor_id>/", StaffPatientRemoveAssignedDoctorView.as_view(), name="staff_patient_remove_assigned_doctor"),

    # ==================== MESSAGING URLS ====================
    # Patient message endpoints
    path("messages/threads/", PatientMessageThreadListView.as_view(), name="patient_thread_list"),
    path("messages/threads/create/", PatientMessageThreadCreateView.as_view(), name="patient_thread_create"),
    path("messages/threads/<int:pk>/", MessageThreadDetailView.as_view(), name="thread_detail"),
    path("messages/threads/<int:thread_id>/messages/", MessageCreateView.as_view(), name="message_create"),
    # Staff message endpoints
    path("staff/messages/threads/", StaffMessageThreadListView.as_view(), name="staff_thread_list"),
    path("staff/messages/threads/<int:pk>/", StaffMessageThreadUpdateView.as_view(), name="staff_thread_update"),
    
    # ==================== LAB RESULTS URLS ====================
    path("lab-tests/", LabTestListView.as_view(), name="lab_test_list"),
    # Patient lab endpoints
    path("lab-orders/me/", PatientLabOrderListView.as_view(), name="patient_lab_order_list"),
    path("lab-orders/<int:pk>/", PatientLabOrderDetailView.as_view(), name="lab_order_detail"),
    # Staff lab endpoints
    path("staff/lab-orders/", StaffLabOrderListView.as_view(), name="staff_lab_order_list"),
    path("staff/lab-orders/create/", StaffLabOrderCreateView.as_view(), name="staff_lab_order_create"),
    path("staff/lab-orders/<int:pk>/", StaffLabOrderUpdateView.as_view(), name="staff_lab_order_update"),
    path("staff/lab-results/create/", StaffLabResultCreateView.as_view(), name="staff_lab_result_create"),
    path("staff/lab-results/<int:pk>/", StaffLabResultUpdateView.as_view(), name="staff_lab_result_update"),
    path("staff/lab-results/<int:result_id>/values/", StaffLabResultValueCreateView.as_view(), name="staff_lab_result_value_create"),
    
    # ==================== BILLING URLS ====================
    path("billable-services/", BillableServiceListView.as_view(), name="billable_service_list"),
    # Patient bill endpoints
    path("bills/me/", PatientBillListView.as_view(), name="patient_bill_list"),
    path("bills/<int:pk>/", PatientBillDetailView.as_view(), name="bill_detail"),
    path("bills/<int:bill_id>/payments/", BillPaymentCreateView.as_view(), name="bill_payment_create"),
    # Staff bill endpoints
    path("staff/bills/", StaffBillListView.as_view(), name="staff_bill_list"),
    path("staff/bills/create/", StaffBillCreateView.as_view(), name="staff_bill_create"),
    path("staff/bills/<int:pk>/", StaffBillUpdateView.as_view(), name="staff_bill_update"),
    path("staff/bills/<int:bill_id>/line-items/", StaffBillLineItemCreateView.as_view(), name="staff_bill_line_item_create"),
    
    # ==================== FAMILY MANAGEMENT URLS ====================
    path("family-members/", PatientFamilyMemberListView.as_view(), name="patient_family_member_list"),
    path("family-members/create/", PatientFamilyMemberCreateView.as_view(), name="patient_family_member_create"),
    path("family-members/<int:pk>/", PatientFamilyMemberDetailView.as_view(), name="patient_family_member_detail"),
    path("staff/family-members/", StaffFamilyMemberListView.as_view(), name="staff_family_member_list"),

    # ==================== ADMIN URLS ====================
    path("admin/users/", AdminUserListView.as_view(), name="admin_user_list"),
    path("admin/users/<int:user_id>/role/", AdminUserRoleUpdateView.as_view(), name="admin_user_role_update"),
]

