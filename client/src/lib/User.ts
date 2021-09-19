import { DIDDocument } from 'did-resolver';
import { UserDetails } from './UserDetails';

export class User {
  constructor(
    readonly didDocument: DIDDocument,
    readonly userDetails: UserDetails
  ) {}
}
