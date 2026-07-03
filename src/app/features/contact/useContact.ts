import type { ContactRequestDto, ContactResponseDto } from '../../../shared/contracts/contact';
import { apiUrl } from '../../api';

export async function sendContact(request: ContactRequestDto): Promise<ContactResponseDto> {
  const response = await fetch(apiUrl('/api/contact'), {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify(request)
  });

  const body = await response.json().catch(() => null) as { error?: string } | ContactResponseDto | null;

  if (!response.ok) {
    throw new Error(body && 'error' in body && body.error ? body.error : 'Unable to send enquiry');
  }

  return body as ContactResponseDto;
}
