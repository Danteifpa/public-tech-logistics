import React from 'react';
import PublicRequest from './PublicRequest';

const NewTicket = () => {
  return (
    <div className="py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Novo Chamado</h1>
        <p className="text-slate-500">Abertura manual de chamado pelo técnico</p>
      </div>
      <PublicRequest />
    </div>
  );
};

export default NewTicket;