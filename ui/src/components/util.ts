import {URL_PARAM_JOIN_ADDRESS, URL_PARAM_JOIN_NAME} from "../service/constants";

export const classNames = (...classes: string[]) => classes.filter(Boolean).join(' ');

export const getInviteChannelJoinURL = (name: string, address: string) => {
  const searchParams = new URLSearchParams()
  searchParams.append(URL_PARAM_JOIN_NAME, name)
  searchParams.append(URL_PARAM_JOIN_ADDRESS, address)
  return window.location.origin + window.location.pathname + '?' + searchParams.toString()
}

const DID_IDENTIFIER_MAX_LENGTH = 10

export const shortenDidEllipsis = (did: string) => {
  const didElements = did.split(':')
  const identifier = didElements[ didElements.length - 1 ]
  didElements[ didElements.length - 1 ] = identifier.length > DID_IDENTIFIER_MAX_LENGTH ? identifier.substr(0,DID_IDENTIFIER_MAX_LENGTH/2) + '...' + identifier.substr(-DID_IDENTIFIER_MAX_LENGTH/2) : identifier
  return didElements.join(':')
}
