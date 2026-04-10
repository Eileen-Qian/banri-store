const phonePattern = /^09\d{8}$/;

type TFunc = (key: string) => string;

export const emailValidation = (t: TFunc) => ({
  required: t("validation.emailRequired"),
  pattern: {
    value: /^\S+@\S+$/i,
    message: t("validation.emailFormat"),
  },
});

export const passwordValidation = (t: TFunc) => ({
  required: t("validation.passwordRequired"),
  minLength: {
    value: 6,
    message: t("validation.passwordMinLength"),
  },
});

export const taiwanPhoneValidation = (t: TFunc) => ({
  required: t("validation.phoneRequired"),
  pattern: {
    value: phonePattern,
    message: t("validation.phoneFormat"),
  },
});

export const nameValidation = (t: TFunc) => ({
  required: t("validation.nameRequired"),
});

export const cityValidation = (t: TFunc) => ({
  required: t("validation.cityRequired"),
});

export const districtValidation = (t: TFunc) => ({
  required: t("validation.districtRequired"),
});

export const addressValidation = (t: TFunc) => ({
  required: t("validation.addressRequired"),
});
