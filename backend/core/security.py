import base64
import hashlib
import copy
import json
import os
import re
import zipfile

from cryptography.fernet import Fernet
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.exceptions import ImproperlyConfigured


APPLICATION_MASK = "****"
APPLICATION_SENSITIVE_FIELDS = {
    "personal": {"ssn", "date_of_birth"},
    "employment_eligibility": {"felony_conviction", "felony_explanation", "driver_license_number", "driver_license_state"},
    "employers": {"starting_pay", "starting_pay_type", "ending_pay", "ending_pay_type"},
    "military": {"veteran", "branch", "rank_at_discharge", "from", "to", "type_of_discharge", "discharge_explanation"},
    "additional": {"disability", "hispanic_latino", "race_categories"},
}


def _application_cipher():
    if not settings.APPLICATION_ENCRYPTION_KEY or not settings.APPLICATION_ENCRYPTION_KEY.strip():
        raise ImproperlyConfigured("Application encryption is not configured.")
    key_material = settings.APPLICATION_ENCRYPTION_KEY.encode("utf-8")
    key = base64.urlsafe_b64encode(hashlib.sha256(key_material).digest())
    return Fernet(key)


def encrypt_ssn(value):
    return _application_cipher().encrypt(value.encode("utf-8")).decode("ascii")


def decrypt_ssn(value):
    if not value:
        return ""
    return _application_cipher().decrypt(value.encode("ascii")).decode("utf-8")


def protect_application_answers(answers):
    """Separate protected answers before anything is written to readable JSON."""
    safe = copy.deepcopy(answers) if isinstance(answers, dict) else {}
    protected = {}
    for section, fields in APPLICATION_SENSITIVE_FIELDS.items():
        source = safe.get(section)
        entries = source if section == "employers" and isinstance(source, list) else [source]
        for index, entry in enumerate(entries):
            if not isinstance(entry, dict):
                continue
            for field in fields:
                value = entry.get(field)
                if value not in (None, "", APPLICATION_MASK, [], [APPLICATION_MASK]):
                    path = f"{section}.{index}.{field}" if section == "employers" else f"{section}.{field}"
                    protected[path] = entry[field]
                entry[field] = [APPLICATION_MASK] if field == "race_categories" else APPLICATION_MASK
    return safe, protected


def encrypt_application_answers(answers):
    return _application_cipher().encrypt(json.dumps(answers, ensure_ascii=False).encode("utf-8")).decode("ascii")


def protected_answer_token(record_id, path):
    # This token is independent of the answer and the encryption key. It carries no applicant data.
    token = hashlib.sha256(f"application-placeholder:{record_id}:{path}".encode("utf-8")).hexdigest()[:24]
    return f"protected:{token}"


def clean_original_filename(filename):
    filename = os.path.basename(filename.replace("\\", "/"))
    filename = re.sub(r"[\x00-\x1f\x7f]", "", filename).strip()
    return filename[:255] or "resume"


def validate_resume_file(upload):
    filename = clean_original_filename(upload.name)
    extension = os.path.splitext(filename)[1].lower()
    if extension not in {".pdf", ".doc", ".docx"}:
        raise ValidationError("Resume must be a PDF, DOC, or DOCX file.")
    if upload.size > 10 * 1024 * 1024:
        raise ValidationError("Resume must be no larger than 10 MB.")

    upload.seek(0)
    header = upload.read(8)
    upload.seek(0)
    valid = False
    if extension == ".pdf":
        valid = header.startswith(b"%PDF-")
    elif extension == ".doc":
        valid = header.startswith(bytes.fromhex("D0CF11E0A1B11AE1"))
    else:
        try:
            with zipfile.ZipFile(upload) as archive:
                valid = "word/document.xml" in archive.namelist()
        except (OSError, zipfile.BadZipFile):
            valid = False
        finally:
            upload.seek(0)

    if not valid:
        raise ValidationError("The resume content does not match its file type.")
    return filename
