import React, { useState, useEffect } from 'react';
import { UserProfile, Chat } from '../types';
import { AdminBadge } from './AdminBadge';
import { ArrowLeft, Search, MoreVertical, Users, UserPlus, Globe, QrCode, X, Lock } from 'lucide-react';

export interface UserContact {
  id: string;
  name: string;
  contactId?: string;
  avatar?: string;
  statusText?: string;
}

interface ContactsScreenProps {
  currentUser: UserProfile;
  chats: Chat[];
  onBack: () => void;
  onSelectContact: (name: string, isGroup: boolean, contactId?: string) => void;
}

export const ContactsScreen: React.FC<ContactsScreenProps> = ({
  currentUser,
  chats,
  onBack,
  onSelectContact
}) => {
  // Pure user contacts - no fake/pre-inserted contacts
  const [userContacts, setUserContacts] = useState<UserContact[]>(() => {
    const saved = localStorage.getItem('chattoj_user_contacts_list');
    return saved ? JSON.parse(saved) : [];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Form states
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [showNewCommunityModal, setShowNewCommunityModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Input states
  const [newContactName, setNewContactName] = useState('');
  const [newContactId, setNewContactId] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newCommunityName, setNewCommunityName] = useState('');

  useEffect(() => {
    localStorage.setItem('chattoj_user_contacts_list', JSON.stringify(userContacts));
  }, [userContacts]);

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim()) return;

    const contact: UserContact = {
      id: 'uc-' + Date.now(),
      name: newContactName.trim(),
      contactId: newContactId.trim() || undefined,
      statusText: newContactId.trim() ? `ID: ${newContactId.trim()}` : 'Cifrado local P2P',
      avatar: `https://images.unsplash.com/photo-${1534528741775 + (userContacts.length * 100)}?w=150&auto=format&fit=crop&q=80`
    };

    setUserContacts(prev => [contact, ...prev]);
    setShowAddContactModal(false);
    setNewContactName('');
    setNewContactId('');

    // Open chat with this new contact right away
    onSelectContact(contact.name, false, contact.contactId);
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    onSelectContact(newGroupName.trim(), true);
    setShowNewGroupModal(false);
    setNewGroupName('');
  };

  const handleCreateCommunity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommunityName.trim()) return;
    onSelectContact(`Comunidad: ${newCommunityName.trim()}`, true);
    setShowNewCommunityModal(false);
    setNewCommunityName('');
  };

  const filteredContacts = userContacts.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.contactId && c.contactId.includes(searchQuery))
  );

  return (
    <div className="w-full flex-1 flex flex-col h-full bg-[#070b08] select-none overflow-hidden relative">
      {/* Top Header - Matches WhatsApp "Contactos" with Back, Count, Search & Menu */}
      <div className="h-14 px-3 bg-[#0d1410] border-b border-emerald-950 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1 -ml-1 text-emerald-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            title="Regresar a mensajes"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {!isSearching ? (
            <div>
              <h2 className="text-base font-semibold text-white leading-tight">
                Contactos
              </h2>
              <p className="text-[11px] text-zinc-400 font-mono">
                {userContacts.length} {userContacts.length === 1 ? 'contacto' : 'contactos'}
              </p>
            </div>
          ) : (
            <div className="flex items-center bg-[#070b08] border border-emerald-900 rounded-xl px-2.5 py-1">
              <Search className="w-3.5 h-3.5 text-zinc-400 mr-2 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar contacto..."
                className="bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none w-44"
                autoFocus
              />
              <button
                onClick={() => {
                  setSearchQuery('');
                  setIsSearching(false);
                }}
                className="text-zinc-400 hover:text-white ml-1 text-xs"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {!isSearching && (
            <button
              onClick={() => setIsSearching(true)}
              className="p-2 text-zinc-300 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Buscar"
            >
              <Search className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setShowAddContactModal(true)}
            className="p-2 text-zinc-300 hover:text-white rounded-lg transition-colors cursor-pointer"
            title="Opciones"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main List Body */}
      <div className="flex-1 overflow-y-auto divide-y divide-emerald-950/20">
        {/* Top 3 Action Rows with Green Circles (Order strictly as in WhatsApp screenshot) */}
        <div className="py-2 space-y-1">
          {/* 1. Nuevo grupo */}
          <button
            onClick={() => setShowNewGroupModal(true)}
            className="w-full px-4 py-3 flex items-center gap-3.5 hover:bg-emerald-950/30 transition-colors text-left cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-black shrink-0 shadow-md">
              <Users className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="text-sm font-medium text-white">Nuevo grupo</span>
          </button>

          {/* 2. Nuevo contacto (with QR icon on the right) */}
          <div className="w-full px-4 py-3 flex items-center justify-between hover:bg-emerald-950/30 transition-colors cursor-pointer">
            <button
              onClick={() => setShowAddContactModal(true)}
              className="flex items-center gap-3.5 flex-1 text-left"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-black shrink-0 shadow-md">
                <UserPlus className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-sm font-medium text-white">Nuevo contacto</span>
            </button>
            <button
              onClick={() => setShowQrModal(true)}
              className="p-2 text-zinc-400 hover:text-emerald-400 transition-colors cursor-pointer"
              title="Escanear o ver código QR"
            >
              <QrCode className="w-5 h-5" />
            </button>
          </div>

          {/* 3. Nueva comunidad */}
          <button
            onClick={() => setShowNewCommunityModal(true)}
            className="w-full px-4 py-3 flex items-center gap-3.5 hover:bg-emerald-950/30 transition-colors text-left cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-black shrink-0 shadow-md">
              <Globe className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="text-sm font-medium text-white">Nueva comunidad</span>
          </button>
        </div>

        {/* Section Heading: "Contactos en Chattoj" */}
        <div className="px-4 py-2.5 bg-[#0a0f0c]/60">
          <span className="text-xs font-semibold text-zinc-400 tracking-wide">
            Contactos en Chattoj
          </span>
        </div>

        {/* Self Contact: "@{currentUser.name} (Tú)" - Envía mensajes a este mismo número/dispositivo */}
        <div
          onClick={() => onSelectContact(`${currentUser.name} (Notas Personales)`, false, currentUser.userId)}
          className="px-4 py-3 flex items-center gap-3.5 hover:bg-emerald-950/30 transition-colors cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-emerald-300 font-bold text-sm shrink-0 overflow-hidden">
            {currentUser.avatar ? (
              <img src={currentUser.avatar} alt="Tú" className="w-full h-full object-cover" />
            ) : (
              currentUser.name.slice(0, 2).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-white truncate flex items-center gap-1.5">
              <span>@{currentUser.name} (Tú)</span>
              <AdminBadge userId={currentUser.userId} />
            </h4>
            <p className="text-xs text-zinc-400 font-mono truncate">
              Guarda mensajes para ti: se quedan únicamente en la memoria de este celular.
            </p>
          </div>
        </div>

        {/* User Contacts List (Empty unless user adds contacts) */}
        {filteredContacts.length === 0 ? (
          <div className="px-6 py-10 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-emerald-950/50 border border-emerald-900/60 flex items-center justify-center text-emerald-500 mb-3">
              <UserPlus className="w-5 h-5" />
            </div>
            <p className="text-xs text-white font-medium max-w-xs mb-1">
              Aquí irán los contactos que agregues.
            </p>
            <p className="text-[11px] text-zinc-300 max-w-xs leading-relaxed mb-2">
              El almacenamiento es en tu dispositivo. Tu lista de contactos solo vive dentro de este teléfono y nada sale a internet.
            </p>
            <p className="text-[10px] text-emerald-400 font-mono">
              Toca "Nuevo contacto" arriba para registrar a alguien y abrir su chat.
            </p>
          </div>
        ) : (
          filteredContacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => onSelectContact(contact.name, false, contact.contactId)}
              className="px-4 py-3 flex items-center gap-3.5 hover:bg-emerald-950/30 transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-300 font-bold text-sm shrink-0">
                {contact.name.slice(0, 2).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-white truncate flex items-center gap-1">
                  <span>{contact.name}</span>
                  <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
                </h4>
                <p className="text-xs text-zinc-400 font-mono truncate">
                  {contact.statusText || 'Conexión cifrada P2P disponible'}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL: NUEVO CONTACTO */}
      {showAddContactModal && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d1410] border border-emerald-800 rounded-3xl p-5 max-w-xs w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-400" />
                Nuevo Contacto
              </h3>
              <button
                onClick={() => setShowAddContactModal(false)}
                className="text-zinc-400 hover:text-white text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveContact} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-mono text-emerald-400 mb-1 uppercase">
                  Nombre
                </label>
                <input
                  type="text"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  className="w-full bg-[#070b08] border border-emerald-900 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-emerald-400 mb-1 uppercase">
                  ID Cuántico (11 dígitos, opcional)
                </label>
                <input
                  type="text"
                  maxLength={11}
                  value={newContactId}
                  onChange={(e) => setNewContactId(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  placeholder="00000000000"
                  className="w-full bg-[#070b08] border border-emerald-900 rounded-xl px-3 py-2 text-xs text-emerald-300 font-mono tracking-wider placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-black font-semibold py-2.5 rounded-xl text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Guardar Contacto e Iniciar Chat
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NUEVO GRUPO */}
      {showNewGroupModal && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d1410] border border-emerald-800 rounded-3xl p-5 max-w-xs w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                Nuevo Grupo
              </h3>
              <button
                onClick={() => setShowNewGroupModal(false)}
                className="text-zinc-400 hover:text-white text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-mono text-emerald-400 mb-1 uppercase">
                  Asunto del grupo
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Ej. Familia, Trabajo, Equipo"
                  className="w-full bg-[#070b08] border border-emerald-900 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  autoFocus
                  required
                />
              </div>

              <p className="text-[11px] text-zinc-300 leading-relaxed">
                El grupo se guarda en la memoria de este celular. Los mensajes viajan directo entre los integrantes sin pasar por empresas externas ni la nube.
              </p>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-black font-semibold py-2.5 rounded-xl text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Crear Grupo
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NUEVA COMUNIDAD */}
      {showNewCommunityModal && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d1410] border border-emerald-800 rounded-3xl p-5 max-w-xs w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                Nueva Comunidad
              </h3>
              <button
                onClick={() => setShowNewCommunityModal(false)}
                className="text-zinc-400 hover:text-white text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCommunity} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-mono text-emerald-400 mb-1 uppercase">
                  Nombre de la comunidad
                </label>
                <input
                  type="text"
                  value={newCommunityName}
                  onChange={(e) => setNewCommunityName(e.target.value)}
                  placeholder="Ej. Red Vecinal, Activismo Local"
                  className="w-full bg-[#070b08] border border-emerald-900 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  autoFocus
                  required
                />
              </div>

              <p className="text-[11px] text-zinc-400 font-mono leading-relaxed">
                Reúne a múltiples grupos temáticos bajo un mismo canal seguro con moderación Llama AI.
              </p>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-black font-semibold py-2.5 rounded-xl text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Crear Comunidad
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: QR CODE */}
      {showQrModal && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d1410] border border-emerald-800 rounded-3xl p-5 max-w-xs w-full shadow-2xl space-y-4 text-center">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Mi Código QR Chattoj</h3>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-zinc-400 hover:text-white text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-white p-4 rounded-2xl inline-block mx-auto shadow-xl">
              <div className="w-36 h-36 bg-[#0a0f0c] rounded-xl flex items-center justify-center text-emerald-400 font-mono text-xs border-2 border-emerald-600 p-2 text-center">
                QR-P2P-{currentUser.userId}
              </div>
            </div>

            <p className="text-xs text-zinc-300 font-mono">
              Tu ID: <span className="text-emerald-400 font-bold">{currentUser.userId}</span>
            </p>
            <p className="text-[11px] text-zinc-300 leading-relaxed">
              Otros usuarios pueden escanear tu código para conectarse de celular a celular. Toda la información se queda dentro de sus propios teléfonos.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
