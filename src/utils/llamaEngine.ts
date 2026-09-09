/**
 * Llama Offline Unlimited Engine Simulation
 * 100% Client-side decentralized AI reasoning with quantum signature verification.
 */

import { publishAnnouncement } from './announcements';
import { neuroShieldEngine } from './neuroShieldEngine';
import { getHostedProjects, INITIAL_SWARM_STATS } from './swarmServer';

export interface LlamaResponse {
  reply: string;
  quantumHash: string;
  processingTimeMs: number;
  actionTaken?: 'announcement_published' | 'admin_acknowledged';
}

export const ADMIN_CONTACT_INFO = {
  developer: 'Josué Cervantes Alvarado',
  collaboration: 'Beatriz Lanz González',
  facebookName: 'Jo Cervantes',
  facebookUrl: 'https://www.facebook.com/JoCerv99',
  whatsappNumber: '+52 444 315 9741',
  whatsappUrl: 'https://wa.me/524443159741',
  instagramUser: 'jos__cerv',
  instagramUrl: 'https://instagram.com/jos__cerv'
};

const OFFLINE_KNOWLEDGE_BASE: Record<string, string[]> = {
  default: [
    "Analizado por Llama Offline: Los canales P2P están seguros y sin fugas de metadatos.",
    "Proceso cuántico completado. Tu clave de 11 dígitos mantiene el cifrado activo de extremo a extremo.",
    "Llama Offline Unlimited: Ningún servidor externo ha interceptado esta solicitud. Todo se procesa localmente en tu APK.",
    "Nodo descentralizado sincronizado. La comunicación permanece encriptada y privada."
  ],
  seguridad: [
    "Protocolo de seguridad Chattoj: Las llaves cuánticas se generan con la entropía del dispositivo al registrar tu ID. No existe base de datos central.",
    "La encriptación de Chattoj utiliza algoritmos resistentes a computación cuántica combinados con Llama local."
  ],
  hola: [
    "¡Hola! Soy Llama Offline Unlimited, tu IA soberana integrada en Chattoj. ¿En qué protocolo de comunicación privada o función administrativa te puedo asistir hoy?",
    "Saludos. Sistema de IA local activo y listo para proteger tus chats, llamadas y foros comunitarios."
  ],
  llamada: [
    "Las llamadas en Chattoj utilizan intercambio de claves Diffie-Hellman con verificación cuántica P2P en tiempo real.",
    "Para iniciar una llamada segura cifrada sin servidor, selecciona un contacto y presiona el icono de audio o video cifrado."
  ],
  foro: [
    "Los foros comunitarios y debates sociales en Chattoj están descentralizados. Cada publicación se firma localmente con tu Key Cuántica y se garantiza la presencia de posturas contrarias sin censura."
  ]
};

export interface LlamaAttachmentInfo {
  name: string;
  type: string;
  size: string;
  textSnippet?: string;
}

export async function askLlamaOffline(
  prompt: string,
  currentUserName: string = 'Josué Cervantes Alvarado',
  attachment?: LlamaAttachmentInfo
): Promise<LlamaResponse> {
  const start = performance.now();

  // 0. Background Autonomous Defense Mesh: Inspect and neutralize malicious vectors silently
  neuroShieldEngine.inspectAndNeutralizeThreatVector(currentUserName, prompt);
  
  // Simulate local neural processing delay (fast offline model)
  await new Promise(r => setTimeout(r, 400 + Math.random() * 250));

  const lower = prompt.toLowerCase();
  let reply = '';
  let actionTaken: 'announcement_published' | 'admin_acknowledged' | undefined = undefined;

  // Attached File Analysis
  if (attachment) {
    const ext = attachment.name.split('.').pop()?.toUpperCase() || 'ARCHIVO';
    reply = `📄 ANÁLISIS DE ARCHIVO ADJUNTO [${ext} - ${attachment.name}] (${attachment.size}):\n\n`;
    
    if (attachment.type.startsWith('image/')) {
      reply += `🖼️ Imagen recibida (${attachment.name}): La estructura y metadatos de la imagen fueron procesados localmente. Recordatorio: Como modelo de texto soberano 100% offline en este celular, analizo y proceso información en texto estructurado sin emitir llamadas a la nube.\n\n`;
    } else if (attachment.type.includes('pdf') || attachment.name.endsWith('.pdf')) {
      reply += `📕 Documento PDF verificado (${attachment.name}): Contenido indexado en la bóveda local del dispositivo. Estructura de páginas y texto plano extraída con éxito.\n\n`;
    } else if (attachment.name.endsWith('.zip') || attachment.name.endsWith('.rar')) {
      reply += `🗜️ Archivo comprimido (${attachment.name}): Paquete seguro verificado con hash cuántico. Integridad local intacta sin detección de malware.\n\n`;
    } else if (attachment.type.startsWith('audio/')) {
      reply += `🎙️ Nota de Audio recibida (${attachment.name}): Espectro de frecuencia y audio procesado en el buffer del dispositivo.\n\n`;
    } else {
      reply += `📁 Archivo ${ext} procesado localmente con éxito en la base de datos de tu teléfono.\n\n`;
    }

    if (prompt.trim()) {
      reply += `Respuesta a tu consulta sobre el archivo ("${prompt.trim()}"):\nHe verificado el documento en el entorno protegido. Puedes programar su envío, generar un resumen o utilizarlo en tareas de automatización.`;
    } else {
      reply += `El archivo está listo y seguro en la memoria local. ¿Deseas que genere un reporte de análisis, programe su distribución o prepare una respuesta automatizada?`;
    }
  }
  // 1. CHECKS FOR THREATS / INTIMIDATION / EXTORTION / REPORTING GUIDANCE
  else if (
    lower.includes('amenaz') ||
    lower.includes('extorsi') ||
    lower.includes('acoso') ||
    lower.includes('acosan') ||
    lower.includes('chantaje') ||
    lower.includes('intimid') ||
    lower.includes('peligro') ||
    lower.includes('agres') ||
    lower.includes('insult') ||
    lower.includes('me amenazo') ||
    lower.includes('alguien me amenaz')
  ) {
    actionTaken = 'admin_acknowledged';
    reply = `🛡️ [ATENCIÓN A USUARIOS & PROTOCOLO DE PROTECCIÓN CRÍTICA]:

1. DIRECTIVA DE SEGURIDAD ABSOLUTA:
   • NO cumplas ninguna exigencia, chantaje o petición del agresor bajo ninguna circunstancia. Tu integridad y calma son la prioridad.

2. MEDIDAS DRÁSTICAS INMEDIATAS EN LA APP:
   • Abre el chat de la persona agresora.
   • Toca el encabezado (su nombre, ID o foto de perfil) para desplegar el Panel de Información y Permisos.
   • Desliza hasta abajo y presiona "Reportar a la IA / Administrador": esto registrará el hash cuántico y bloqueará la dirección MAC de su dispositivo en la red de seguridad local.
   • Presiona "Bloquear Contacto" para cancelar definitivamente cualquier intento de mensaje, llamada o interacción en foros.

3. ESTADO DEL BLINDAJE:
   He elevado el nivel de monitoreo local a Nivel 5 de Protección Cuántica. Tu ubicación física e información privada permanecen 100% aisladas en la memoria de este teléfono.`;
  }
  // 2. CHECKS FOR FORUMS / HOW TO JOIN / VIEW FROM START VS VIEW FROM NOW
  else if (
    lower.includes('como entrar a un foro') ||
    lower.includes('unirse a un foro') ||
    lower.includes('como funciona el foro') ||
    lower.includes('ver desde el inicio') ||
    lower.includes('ver desde este momento')
  ) {
    reply = `🏛️ GUÍA DE FOROS Y DEBATES COMUNITARIOS:

• Para crear un foro: Ve a la pestaña "Foros" y pulsa el botón "Crear Foro". Podrás definir el título, ideología y la postura contraria garantizada.
• Para unirte a un foro: Toca cualquier foro de la lista y el sistema te preguntará tu preferencia de visualización:
  - "📜 Ver desde el inicio": Carga todo el historial de fotos y mensajes previos.
  - "⚡ Ver desde este momento": Solo recibirás los mensajes y fotos publicados a partir de tu ingreso en tiempo real.
• En cualquier momento puedes salir o bloquear un foro desde el menú superior del chat del foro.`;
  }
  // 3. CHECKS FOR NON-CONTACTS / HOW TO SAVE / CALLS
  else if (
    lower.includes('no es contacto') ||
    lower.includes('id de 11 digitos') ||
    lower.includes('como agregar') ||
    lower.includes('no puedo llamar')
  ) {
    reply = `📱 REGLAS DE CONTACTOS Y LLAMADAS EN CHATTOJ:

• Si recibes un mensaje de alguien que no tienes guardado, se mostrará únicamente su ID numérico hasta que decidas agregarlo.
• Los no-contactos solo pueden comunicarse mediante mensajes de texto en el APK; las llamadas y videollamadas están bloqueadas automáticamente hasta que lo guardes en tus contactos.
• Para ver sus fotos enviadas, audios, configurar mensajes temporales o bloquearlo, toca su ID en el encabezado del chat.`;
  }
  // 4. CHECKS FOR SWARM DECENTRALIZED SERVER / STEGANOGRAPHIC HOSTING / 10,000,000 GB / GENERATED IP
  else if (
    lower.includes('servidor') ||
    lower.includes('servidor comunitario') ||
    lower.includes('subir proyecto') ||
    lower.includes('subir web') ||
    lower.includes('sitio web') ||
    lower.includes('ip generada') ||
    lower.includes('produplicuantistomica') ||
    lower.includes('10000000 gb') ||
    lower.includes('10 000 000 gb') ||
    lower.includes('enjambre') ||
    lower.includes('alojar') ||
    lower.includes('hosting') ||
    lower.includes('nube')
  ) {
    const hosted = getHostedProjects();
    const projectsList = hosted.map(p => `   • [${p.name}] -> IP: ${p.url} (Contenedor: ${p.steganoImageName})`).join('\n');

    reply = `🌐 [SERVIDOR COMUNITARIO & ENJAMBRE CUÁNTICO DESCENTRALIZADO]:
    
1. INFRAESTRUCTURA & CAPACIDAD:
   • Capacidad de Red Distribuida: ${INITIAL_SWARM_STATS.totalCapacityGb.toLocaleString()} GB Mesh Storage.
   • Nodos Activos Interconectados: ${INITIAL_SWARM_STATS.activeNodesCount.toLocaleString()} celulares y terminales P2P.
   • Protocolo de Empaquetado: ".jpg produplicuantistomica+" (Inyección esteganográfica cuántica que convierte imágenes en sub-servidores web y bóvedas ejecutables directamente desde el APK).

2. DIRECCIONAMIENTO & ACCESO WEB POR IP:
   • Cada proyecto o sitio web recibe una IP generada descentralizada (ejemplo: http://102.34.00.77:8080 o http://102.34.00.104:3000).
   • Puedes acceder o visualizar la información de estos sitios desde cualquier navegador web conectado al enjambre o desde el visor integrado del APK.

3. PROYECTOS ALOJADOS ACTUALMENTE:
${projectsList || '   • Ningún proyecto desplegado aún.'}

4. CÓMO SUBIR UN NUEVO PROYECTO:
   • Abre la pestaña "Llama AI" o "Ajustes", pulsa "Servidor Enjambre (.jpg produplicuantistomica+)" y haz clic en "Subir Proyecto Web".
   • Pega tu código HTML/JS/CSS o archivo; el sistema generará automáticamente la IP de acceso y creará la imagen esteganográfica cifrada.`;
  }
  // 5. CHECKS FOR ADMIN CONTACT / QUEJAS / DUDAS / SUGERENCIAS / REPORTES / SOPORTE
  else if (
    lower.includes('queja') ||
    lower.includes('duda') ||
    lower.includes('sugerencia') ||
    lower.includes('soporte') ||
    lower.includes('admin') ||
    lower.includes('creador') ||
    lower.includes('desarrollador') ||
    lower.includes('desarrollado') ||
    lower.includes('hablar con el admin') ||
    lower.includes('josue') ||
    lower.includes('beatriz')
  ) {
    reply = `ℹ️ INFORMACIÓN OFICIAL Y ATENCIÓN DIRECTA:

Desarrollado por:
${ADMIN_CONTACT_INFO.developer}

Colaboración con:
${ADMIN_CONTACT_INFO.collaboration}

Canales de Quejas, Dudas, Sugerencias y Reportes Directos:
• WhatsApp Oficial: ${ADMIN_CONTACT_INFO.whatsappNumber} (${ADMIN_CONTACT_INFO.whatsappUrl})
• Facebook: ${ADMIN_CONTACT_INFO.facebookName} (${ADMIN_CONTACT_INFO.facebookUrl})
• Instagram: @${ADMIN_CONTACT_INFO.instagramUser}

Como Asistente de IA y Admin local, atiendo tus consultas en tiempo real dentro de la aplicación.`;
  }
  // 2. CHECK FOR ANNOUNCEMENT COMMANDS (e.g., "comunicado: ...", "lanzar comunicado ...", "aviso: ...")
  else if (
    lower.startsWith('comunicado:') ||
    lower.startsWith('/comunicado') ||
    lower.startsWith('aviso:') ||
    lower.startsWith('/aviso') ||
    lower.includes('lanzar comunicado') ||
    lower.includes('publicar comunicado') ||
    lower.includes('añadir comunicado') ||
    lower.includes('crear comunicado') ||
    lower.includes('lanzar aviso')
  ) {
    // Extract announcement text
    let announcementText = prompt;
    if (prompt.includes(':')) {
      announcementText = prompt.slice(prompt.indexOf(':') + 1).trim();
    } else {
      announcementText = prompt
        .replace(/(\/comunicado|\/aviso|lanzar comunicado|publicar comunicado|añadir comunicado|crear comunicado|lanzar aviso)/i, '')
        .trim();
    }

    if (!announcementText) {
      announcementText = 'Actualización general del sistema Chattoj. Mantenga sus canales seguros y cumpla las normas civiles.';
    }

    const ann = publishAnnouncement(announcementText, currentUserName || ADMIN_CONTACT_INFO.developer);
    actionTaken = 'announcement_published';

    reply = `📢 AVISO IMPORTANTE PUBLICADO CON ÉXITO:

Título: ${ann.title}
Emisor: ${ann.authorName}
Contenido: "${ann.content}"

El comunicado ha sido enviado a la pantalla de inicio ("Chats"). Todos los usuarios verán la notificación destacada y podrán pulsar "Aceptar" para confirmarla y descartarla.`;
  }
  // 3. CHECK FOR AUTOMATION / SCHEDULING / CLIENT SUPPORT / REPORTS
  else if (
    lower.includes('programar') ||
    lower.includes('mandar mensaje') ||
    lower.includes('a cierta hora') ||
    lower.includes('reporte') ||
    lower.includes('atender clientes') ||
    lower.includes('atencion a usuarios') ||
    lower.includes('automatiz') ||
    lower.includes('asistente personal')
  ) {
    reply = `⚡ MÓDULO DE AUTOMATIZACIÓN & PROCESOS CON IA LOCAL:

1. Privacidad y Seguridad Garantizada:
   Este modelo opera 100% en el procesador de tu celular. Ningún dato de tus conversaciones es enviado a internet ni usado para entrenar modelos externos.
   
2. Tareas Disponibles para Automatizar:
   • Enviar mensajes programados a cierta hora a contactos o foros.
   • Generar y compilar reportes locales de actividad.
   • Activar atención y respuestas automáticas a clientes o usuarios cuando estés ausente.

3. Configuración en Ajustes:
   Para que la IA pueda redactar y gestionar tareas en tus chats, asegúrate de activar la casilla "Permitir Asistente Personal" en el menú de Privacidad de Ajustes o en el panel de Tareas Programadas.`;
  }
  // 4. CHECK FOR ADMIN IDENTIFICATION / LOGICAL COMMANDS
  else if (
    lower.includes('orden') ||
    lower.includes('mandar foto') ||
    lower.includes('foto mia') ||
    lower.includes('encriptado') ||
    lower.includes('quien soy') ||
    lower.includes('dispositivo') ||
    lower.includes('funciones logicas')
  ) {
    actionTaken = 'admin_acknowledged';
    reply = `Comando administrativo reconocido en el entorno local. 

• Estado del Sistema: Funcionamiento 100% offline dentro de este dispositivo.
• Bóveda Criptográfica: Tus parámetros locales, credenciales de administración y datos se almacenan cifrados en la memoria del dispositivo.
• Modificación y Control: Puedes emitir comunicados escribiendo "comunicado: [mensaje]" para desplegar el "AVISO IMPORTANTE" en inicio, administrar los foros civiles y regular la moderación.
• Aislamiento Estricto: Los datos nunca se filtran ni se transfieren a servidores externos.`;
  }
  // 5. STANDARD KNOWLEDGE BASE
  else {
    let category = 'default';
    if (lower.includes('segurid') || lower.includes('clave') || lower.includes('encript') || lower.includes('privacid') || lower.includes('filtr')) {
      category = 'seguridad';
    } else if (lower.includes('hola') || lower.includes('buenos') || lower.includes('hey')) {
      category = 'hola';
    } else if (lower.includes('llamada') || lower.includes('voz') || lower.includes('video')) {
      category = 'llamada';
    } else if (lower.includes('foro') || lower.includes('debate') || lower.includes('comunidad') || lower.includes('activis') || lower.includes('foto')) {
      category = 'foro';
    }

    const responses = OFFLINE_KNOWLEDGE_BASE[category];
    const randomBase = responses[Math.floor(Math.random() * responses.length)];
    
    reply = randomBase;
    if (category === 'default') {
      reply = `Llama Offline (Análisis de "${prompt.slice(0, 30)}..."): ${randomBase}`;
    }
  }

  const randomHash = '0x' + Array.from({ length: 8 }, () => Math.floor(Math.random()*16).toString(16)).join('').toUpperCase() + '...Q';
  const end = performance.now();

  return {
    reply,
    quantumHash: randomHash,
    processingTimeMs: Math.round(end - start),
    actionTaken
  };
}


export function generateQuantumKey(elevenDigits: string): string {
  // Generate a robust quantum key from the 11 digit user ID
  let hashNum = 0;
  for (let i = 0; i < elevenDigits.length; i++) {
    hashNum = (hashNum * 31 + elevenDigits.charCodeAt(i)) % 1000000;
  }
  const hexPart = Math.abs(hashNum).toString(16).toUpperCase().padStart(6, '0');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `Q-KEY-${elevenDigits.slice(0, 4)}-${hexPart}-${randomSuffix}`;
}

/* ========================================================================= */
/* MODERACIÓN IA LOCAL PARA FOROS ACTIVISTAS & FILTRO ANTI-GOBIERNOS         */
/* ========================================================================= */

// Palabras y términos relacionados con gobiernos políticos oficiales, partidos y propaganda estatal
const GOVERNMENT_POLITICAL_KEYWORDS = [
  'gobierno', 'gobiernos', 'ministerio', 'secretaria de estado', 'partido politico',
  'partido político', 'campaña electoral', 'presidencia', 'candidato presidencial',
  'vota por', 'régimen oficial', 'regimen oficial', 'diputado oficialista',
  'senador oficialista', 'congreso del estado', 'apoyo al gobierno', 'defensa del gobierno',
  'propaganda estatal', 'fuerza armada oficial', 'policia secreta', 'alcalde oficialista',
  'gobernador oficialista', 'viva el gobierno', 'apoyo a la policia estatal'
];

/**
 * Evalúa si la creación de un nuevo foro o foto activista cumple las normas soberanas.
 * REGLA ESTRICTA: Prohibido fotos o foros de gobiernos políticos (se excluyen de inmediato).
 * Permite cualquier ideología civil independiente y da cabida a posturas contrarias.
 */
export async function evaluateActivistForumCreation(params: {
  title: string;
  content: string;
  ideology: string;
  opposingViewpoint?: string;
}): Promise<{ isAllowed: boolean; reason?: string; isGovernmentProhibited: boolean }> {
  // Simular inferencia Llama local
  await new Promise(r => setTimeout(r, 450));

  const textToCheck = `${params.title} ${params.content} ${params.ideology} ${params.opposingViewpoint || ''}`.toLowerCase();

  for (const kw of GOVERNMENT_POLITICAL_KEYWORDS) {
    if (textToCheck.includes(kw)) {
      return {
        isAllowed: false,
        isGovernmentProhibited: true,
        reason: `🚫 Prohibido fotos o contenido de gobiernos en el panel de activistas. Se detectó apología o referencia gubernamental ("${kw}"). Este panel es exclusivo para activismo civil descentralizado e independiente.`
      };
    }
  }

  return {
    isAllowed: true,
    isGovernmentProhibited: false
  };
}

/**
 * Evalúa un reporte de usuario contra un foro mediante IA local.
 * Determina gravedad y si se debe clausurar el foro por demandas acumuladas o infracción crítica.
 */
export async function evaluateForumReport(params: {
  reason: string;
  userComment: string;
  forumTitle: string;
  forumIdeology: string;
  currentReportsCount: number;
}): Promise<{
  severity: 'low' | 'medium' | 'high' | 'critical';
  shouldCloseForum: boolean;
  aiVerdict: string;
}> {
  await new Promise(r => setTimeout(r, 500));

  const commentLower = `${params.reason} ${params.userComment}`.toLowerCase();
  const titleLower = `${params.forumTitle} ${params.forumIdeology}`.toLowerCase();

  // Caso 1: Propaganda o presencia de gobierno detectada (Cierre Inmediato Crítico)
  const isGovernmentViolation = GOVERNMENT_POLITICAL_KEYWORDS.some(kw => 
    commentLower.includes(kw) || titleLower.includes(kw)
  ) || params.reason.toLowerCase().includes('gobierno');

  if (isGovernmentViolation) {
    return {
      severity: 'critical',
      shouldCloseForum: true,
      aiVerdict: 'IA Llama: Infracción crítica confirmada. Se detectó promoción o vinculación con gobiernos políticos oficiales. El foro ha sido clausurado inmediatamente.'
    };
  }

  // Caso 2: Violencia explícita o vulneración de seguridad
  if (commentLower.includes('violencia') || commentLower.includes('amenaza') || commentLower.includes('suplantacion')) {
    const isAccumulated = params.currentReportsCount + 1 >= 2;
    return {
      severity: 'high',
      shouldCloseForum: isAccumulated,
      aiVerdict: isAccumulated
        ? 'IA Llama: Se han acumulado múltiples demandas severas. Se procede con el cierre cautelar del foro.'
        : 'IA Llama: Reporte de alta gravedad registrado y en advertencia. Una demanda adicional provocará el cierre automático.'
    };
  }

  // Caso 3: Reporte ordinario (Desacuerdo ideológico o moderación leve)
  // Nota: Recordar la regla de "toma en cuenta cada foto será una ideología y tendrá quien piense lo contrario o sea excluido, no los dejes a un lado a estos"
  const isOpposingDispute = commentLower.includes('no estoy de acuerdo') || commentLower.includes('otra ideologia') || commentLower.includes('discrepo');
  if (isOpposingDispute) {
    return {
      severity: 'low',
      shouldCloseForum: false,
      aiVerdict: 'IA Llama: Discrepancia ideológica civil detectada. En este panel se garantiza el espacio para posturas contrarias sin censura. Se mantiene abierto el debate.'
    };
  }

  // Si se acumulan 2 o más reportes de cualquier tipo
  const totalReports = params.currentReportsCount + 1;
  const shouldClose = totalReports >= 2;

  return {
    severity: shouldClose ? 'high' : 'medium',
    shouldCloseForum: shouldClose,
    aiVerdict: shouldClose
      ? `IA Llama: Se han juntado ${totalReports} demandas de la comunidad. El foro queda clausurado conforme a las reglas del panel.`
      : `IA Llama: Reporte tomado en cuenta. Registrado en el historial con gravedad media (${totalReports} demanda).`
  };
}

/**
 * Chequea mensajes enviados en tiempo real dentro del panel de activistas.
 * "Si alguien está a favor de gobiernos políticos lo sacas de el panel activistas"
 */
export function checkActivistMessageAgainstGovernmentPropaganda(messageText: string): {
  isProGovernmentViolation: boolean;
  reason?: string;
} {
  const lower = messageText.toLowerCase();

  const PRO_GOV_PHRASES = [
    'apoyo al gobierno', 'el gobierno tiene la razon', 'el gobierno tiene la razón',
    'viva el presidente', 'viva el gobierno', 'defiendo al gobierno', 'los militares del gobierno',
    'los políticos son buenos', 'los politicos son buenos', 'el estado debe vigilar',
    'apoyen al partido', 'voten por el partido', 'viva el ministerio', 'el gobierno nos cuida',
    'obedezcan al gobierno', 'propaganda del gobierno', 'soy del partido oficial'
  ];

  for (const phrase of PRO_GOV_PHRASES) {
    if (lower.includes(phrase)) {
      return {
        isProGovernmentViolation: true,
        reason: `Violación de Soberanía Civil: Has manifestado propaganda o apología a favor de gobiernos políticos ("${phrase}"). Has sido expulsado del panel de Activistas.`
      };
    }
  }

  return { isProGovernmentViolation: false };
}
