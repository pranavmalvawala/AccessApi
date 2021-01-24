export type ResetPasswordRequest = {
    fromEmail: string;
    userEmail: string;
    subject: string;
    body: string;
};
