import base64
import hashlib
import os
import re
import zipfile

from cryptography.fernet import Fernet
from django.conf import settings
from django.core.exceptions import ValidationError


def _application_cipher():
    key_material = settings.APPLICATION_ENCRYPTION_KEY.encode("utf-8")
    key = base64.urlsafe_b64encode(hashlib.sha256(key_material).digest())
    return Fernet(key)


def encrypt_ssn(value):
    return _application_cipher().encrypt(value.encode("utf-8")).decode("ascii")


def decrypt_ssn(value):
    if not value:
        return ""
    return _application_cipher().decrypt(value.encode("ascii")).decode("utf-8")


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