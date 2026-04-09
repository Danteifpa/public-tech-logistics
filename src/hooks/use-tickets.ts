import { useTicketContext } from '../context/TicketContext';

export const useTickets = () => {
  return useTicketContext();
};