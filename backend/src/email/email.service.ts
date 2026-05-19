import { Injectable } from '@nestjs/common';
import * as Brevo from '@getbrevo/brevo';

@Injectable()
export class EmailService {
  private brevoClient = new Brevo.BrevoClient({
    apiKey: process.env.BREVO_API_KEY!,
  });

  async sendInvitation(email: string, token: string) {
    const link = `http://localhost:4200/auth/activateAccount?token=${token}`; // TODO mettre variable pour la passation

    await this.brevoClient.transactionalEmails.sendTransacEmail({
      sender: {
        email: process.env.BREVO_SENDER_EMAIL!,
        name: process.env.BREVO_SENDER_NAME!,
      },
      to: [{ email }],
      subject: 'Invitation à rejoindre la plateforme Thesis',
      htmlContent: `
        <h2>Invitation</h2>
        <p>Vous avez été invité à rejoindre la plateforme Thesis.</p>
        <p>
          <a href="${link}">Activer mon compte</a>
        </p>
      `,
    });
  }
}