# backend/accounts/validators.py
"""
Custom password validators: at least one uppercase, one digit, one special character, minimum 8 length.
"""
import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _


class UppercaseValidator:
    """Ensure password contains at least one uppercase letter."""

    def validate(self, password, user=None):
        if not re.search(r'[A-Z]', password):
            raise ValidationError(
                _("Password must contain at least one uppercase letter."),
                code='password_no_upper',
            )

    def get_help_text(self):
        return _("Your password must contain at least one uppercase letter.")


class DigitValidator:
    """Ensure password contains at least one digit."""

    def validate(self, password, user=None):
        if not re.search(r'\d', password):
            raise ValidationError(
                _("Password must contain at least one number."),
                code='password_no_digit',
            )

    def get_help_text(self):
        return _("Your password must contain at least one number.")


class SpecialCharacterValidator:
    """Ensure password contains at least one special character."""

    def validate(self, password, user=None):
        # Allow common special chars: !@#$%^&*()_+-=[]{}|;:'",.<>?/\`
        if not re.search(r'[!@#$%^&*()_+\-=\[\]{}|;:\'",.<>?/\\`~]', password):
            raise ValidationError(
                _("Password must contain at least one special character (e.g. !@#$%^&*)."),
                code='password_no_special',
            )

    def get_help_text(self):
        return _("Your password must contain at least one special character (e.g. !@#$%^&*).")
