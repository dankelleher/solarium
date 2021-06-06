import {URL_PARAM_JOIN_ADDRESS, URL_PARAM_JOIN_NAME} from "../service/constants";

export const classNames = (...classes: string[]) => classes.filter(Boolean).join(' ');

export const getInviteChannelJoinURL = (name: string, address: string) => {
  const searchParams = new URLSearchParams()
  searchParams.append(URL_PARAM_JOIN_NAME, name)
  searchParams.append(URL_PARAM_JOIN_ADDRESS, address)
  return window.location.origin + window.location.pathname + '?' + searchParams.toString()
}
