from allauth.socialaccount.adapter import DefaultSocialAccountAdapter


class FoundItSocialAccountAdapter(DefaultSocialAccountAdapter):

    def save_user(self, request, sociallogin, form=None):

        user = super().save_user(
            request,
            sociallogin,
            form
        )

        extra_data = sociallogin.account.extra_data

        user.full_name = extra_data.get(
            "name",
            ""
        )

        user.email = extra_data.get(
            "email",
            user.email
        )

        user.save()

        return user