import React from 'react';
import { useModal } from '../contexts/ModalContext';
import { IconMail } from '@tabler/icons-react';
import { SLA } from '../data/mockData';

export default function EmailSimModal() {
  const { modal, closeModal } = useModal();
  const { ticket: t } = modal.props;

  if (!t) return null;

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
      <div className="modal" style={{ maxWidth: '500px' }}>
        <div className="modal-hdr">
          <h2><IconMail size={18} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} /> Email notification sent</h2>
          <button className="close-x" onClick={closeModal}>×</button>
        </div>
        <div className="email-sim">
          <strong>From:</strong> support@sifratech.com<br/>
          <strong>To:</strong> {t.raisedBy.toLowerCase().replace(/ /g, '.')}@client.com{t.ccMail ? <><br/><strong>CC:</strong> {t.ccMail}</> : ''}<br/>
          <strong>Subject:</strong> [{t.id}] Ticket Created — {t.summary}<br/><br/>
          Dear {t.raisedBy},<br/><br/>
          Ticket <strong>{t.id}</strong> created. Priority: {t.priority} | Module: {t.module} | SLA: {SLA[t.priority]}h.<br/><br/>
          You will be notified on each status change.<br/><br/>
          Regards,<br/>Sifratech Support Team
        </div>
        <div className="form-actions"><button className="btn-p" onClick={closeModal}>OK</button></div>
      </div>
    </div>
  );
}
