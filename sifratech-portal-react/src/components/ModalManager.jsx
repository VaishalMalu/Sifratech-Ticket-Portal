import React from 'react';
import { useModal } from '../contexts/ModalContext';
import CreateTicketModal from './CreateTicketModal';
import TicketDetailModal from './TicketDetailModal';
import EmailSimModal from './EmailSimModal';

export default function ModalManager() {
  const { modal } = useModal();

  if (!modal.type) return null;

  return (
    <div id="modalArea">
      {modal.type === 'CREATE_TICKET' && <CreateTicketModal />}
      {modal.type === 'TICKET_DETAIL' && <TicketDetailModal />}
      {modal.type === 'EMAIL_SIM' && <EmailSimModal />}
    </div>
  );
}
