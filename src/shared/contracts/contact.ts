export type ContactRequestDto = {
  name: string;
  email: string;
  organisation: string;
  message: string;
  turnstileToken: string;
};

export type ContactResponseDto = {
  status: 'sent';
};
