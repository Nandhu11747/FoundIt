
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed


class FoundItJWTAuthentication(JWTAuthentication):

    def get_user(self, validated_token):
        user = super().get_user(validated_token)

        if user.status != "active":
            raise AuthenticationFailed(
                "Your account is restricted or inactive."
            )

        return user
