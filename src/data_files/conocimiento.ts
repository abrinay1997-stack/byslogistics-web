/**
 * Conocimiento de producto del asistente, dictado por las dueñas del negocio.
 *
 * QUÉ ES ESTO Y POR QUÉ VIVE APARTE
 *
 * El resto de la base del chat se genera desde lo que ya renderiza el sitio:
 * las colecciones de contenido, `constants.ts`, `empresa.ts` y `faqs.json`
 * (ver `src/pages/kb.json.ts`). Esa regla es buena y se mantiene: un dato que
 * se ve en una página no se copia aquí, se edita en su página.
 *
 * Este archivo es para lo otro: el saber del oficio que el negocio tiene y que
 * ninguna página tenía dónde alojar. Son las respuestas que las dueñas dan por
 * teléfono cuando alguien pregunta qué norma le están exigiendo en el puerto,
 * en qué se diferencia una etiqueta No Transfer de una VOID o por qué en una
 * válvula no va lo mismo que en un contenedor. Meterlas a la fuerza en una
 * página habría inflado el sitio con material que casi nadie lee entero; en el
 * chat, en cambio, cada una sale sola cuando alguien pregunta justo por ella.
 *
 * PROCEDENCIA. Todo lo de aquí sale del documento de preguntas frecuentes que
 * escribieron las dueñas. Es información de primera mano y tiene prioridad
 * sobre cualquier redacción anterior del sitio: donde algo se contradecía —el
 * caso del precinto botella, que estaba puesto como solución de válvulas
 * cuando es el de los contenedores marítimos— se corrigió la página, no se
 * duplicó la corrección aquí.
 *
 * CÓMO SE ESCRIBE UN HECHO NUEVO
 *
 *  - Autocontenido. El modelo recibe cinco o seis hechos sueltos y no puede
 *    reconstruir nada: cada texto tiene que entenderse sin los demás.
 *  - Con sus `q`. La recuperación es léxica (ver `retrieve` en
 *    netlify/functions/_retrieval.mts), así que solo encuentra las palabras
 *    que estén escritas. Las `q` son las formas reales en que la gente
 *    pregunta, no sinónimos de diccionario: "qué me exigen en el puerto" antes
 *    que "normativa de sellado marítimo".
 *  - Sin cifras de dinero. La barandilla del chat bloquea cualquier importe, y
 *    un hecho con precio dentro haría que el asistente se autocensure.
 *  - Sin promesas que el negocio no controle: nada de plazos de entrega,
 *    stock garantizado ni cantidades mínimas concretas. Eso se cotiza.
 */

export interface HechoConocimiento {
  id: string;
  topic: string;
  /** Formas reales en que la gente pregunta por esto. */
  q: string[];
  /** La respuesta, ya redactada. El modelo la parafrasea, no la deduce. */
  text: string;
}

export const CONOCIMIENTO: HechoConocimiento[] = [
  /* ---------------- Lenguaje del oficio ---------------- */

  /*
   * El primero de la lista por un motivo práctico: media clientela no dice
   * "precinto". Dice sello, marchamo o bolt seal según de dónde venga, y si el
   * asistente no reconoce esas palabras la conversación empieza mal.
   */
  {
    id: 'terminologia-precinto-sello-marchamo',
    topic: 'productos',
    q: [
      'diferencia entre precinto y sello de seguridad',
      'que es un marchamo',
      'marchamo de seguridad',
      'bolt seal',
      'sello de seguridad para contenedores',
      'tamper evident',
      'es lo mismo precinto que sello',
    ],
    text:
      'Precinto, sello y marchamo de seguridad son lo mismo: no hay diferencia técnica entre ellos, solo de ' +
      'terminología según la industria y la región. En transporte terrestre se dice precinto, en comercio ' +
      'exterior sello de seguridad para contenedores y en la industria marchamo; en inglés, el precinto ' +
      'botella se llama bolt seal y las etiquetas que evidencian apertura, tamper evident. Lo que sí cambia ' +
      'de verdad es qué solución corresponde a cada aplicación.',
  },

  {
    id: 'nombre-bys-logistics',
    topic: 'empresa',
    q: [
      'bys logistics',
      'byslogistics',
      'business and supplies logistics',
      'son ustedes bys',
      'como se llama la empresa',
    ],
    text:
      'Business & Supplies Logistics S.A.S. es la razón social; también nos conocen como BYS LOGISTICS ' +
      'S.A.S. y como B&S Logistics. Son la misma empresa, la que distribuye y comercializa precintos, ' +
      'etiquetas, tulas, cajas y demás elementos de seguridad preventiva desde Bogotá.',
  },

  /* ---------------- Qué hace un precinto y qué no ---------------- */

  {
    id: 'precinto-no-es-candado',
    topic: 'precintos',
    q: [
      'un precinto evita el robo',
      'sirve como candado',
      'que tan seguro es un precinto',
      'se puede romper un precinto',
      'para que sirve realmente un precinto',
    ],
    text:
      'Un precinto no es un candado y no pretende impedir el acceso: su función es dejar una evidencia ' +
      'visible de que alguien intentó abrir o manipular lo que protege. Por eso su valor depende de que el ' +
      'número quede registrado al despachar y de que alguien lo verifique al recibir. Así se reducen ' +
      'riesgos de hurto, sustitución de mercancía, contaminación de carga, pérdidas de inventario y ' +
      'accesos no autorizados.',
  },

  {
    id: 'aplicaciones-generales',
    topic: 'precintos',
    q: [
      'donde se usan los precintos',
      'en que se pueden usar',
      'sirve para mixer',
      'mezcladora de cemento',
      'carro de paro',
      'trolley de aerolinea',
      'balanzas',
      'medidores de servicios publicos',
      'surtidores de combustible',
      'gavetas y canastillas',
    ],
    text:
      'Los precintos se usan en camiones y furgones de carga, contenedores marítimos, carrotanques y ' +
      'camiones cisterna, mixers o mezcladoras de cemento, tulas de recaudo y transporte de valores, ' +
      'válvulas, medidores de servicios públicos, balanzas y surtidores de combustible, cajas y ' +
      'contenedores de seguridad, carros de paro hospitalarios, trolleys de aerolíneas, gavetas y ' +
      'canastillas de distribución, centros de distribución y bodegas, y mercancías en tránsito.',
  },

  {
    id: 'como-funciona-el-precintado',
    topic: 'precintos',
    q: [
      'como funciona un precinto',
      'como se usa un precinto',
      'como implemento un control de precintos',
      'que hago con el numero del precinto',
      'como verifico un precinto al recibir',
      'como funcionan los precintos en logistica y transporte',
    ],
    text:
      'El sistema tiene cuatro pasos y ninguno sobra: se instala el precinto en el punto de acceso que se ' +
      'quiere proteger, se registra su numeración en la documentación o en el sistema de control, la carga ' +
      'viaja, y en destino se compara el número con el registrado y se revisa el cuerpo del precinto. Si ' +
      'coincide y no hay señales de manipulación, se confirma que la carga mantuvo su integridad. Un ' +
      'precinto que nadie registra ni verifica no acredita nada.',
  },

  {
    id: 'trazabilidad-que-permite-controlar',
    topic: 'precintos',
    q: [
      'como mejora la trazabilidad',
      'que permite controlar un precinto',
      'sirve para auditorias',
      'control de inventarios y activos',
      'cadena de custodia',
    ],
    text:
      'Al asociar una identificación única a cada operación, el precinto permite controlar salidas y ' +
      'despachos, recepción de carga en destino, transferencias entre operadores logísticos, aperturas ' +
      'autorizadas, inventarios y activos, y procesos de auditoría y cumplimiento. Con eso se puede ' +
      'identificar dónde ocurrió una novedad, quién tenía la custodia y en qué momento pudo presentarse la ' +
      'manipulación.',
  },

  /*
   * Los cinco hechos que siguen contestan la pregunta que llega antes que
   * cualquier referencia: "¿y esto para qué me sirve a mí?". Quien la hace no
   * está eligiendo producto todavía —está justificando el gasto ante alguien—,
   * así que la respuesta útil habla de riesgos y de controles, no de catálogo.
   */
  {
    id: 'cadena-de-suministro-por-que-importan',
    topic: 'precintos',
    q: [
      'por que son importantes los precintos',
      'que beneficios tiene precintar',
      'para que me sirve precintar la carga',
      'cadena de suministro',
      'vale la pena precintar',
      'que gano usando precintos',
    ],
    text:
      'En una cadena de suministro la carga pasa por fabricantes, transportadores, operadores logísticos, ' +
      'centros de distribución, puertos, aduanas y cliente final, y en cada entrega hay un riesgo de ' +
      'manipulación, sustitución o pérdida. El precinto reduce ese riesgo, mejora la trazabilidad, ' +
      'facilita auditorías e inspecciones, ayuda a establecer responsabilidades cuando algo pasa y genera ' +
      'confianza entre proveedores, transportadores y clientes.',
  },

  {
    id: 'precintos-numerados-beneficios',
    topic: 'precintos',
    q: [
      'para que sirve la numeracion consecutiva',
      'que aporta un precinto numerado',
      'beneficios de los precintos de seguridad numerados',
      'ventajas de la numeracion',
      'precintos numerados',
      'diferencia entre precinto numerado y sin numerar',
      'pueden cambiar un precinto por otro igual',
    ],
    text:
      'Un precinto sin número no prueba nada: cualquier otro igual puede ocupar su lugar sin que se note. ' +
      'La numeración consecutiva identifica de forma única cada despacho o activo, así que permite ' +
      'verificar si el precinto es el que se instaló, detectar sustituciones o reutilizaciones, ubicar ' +
      'irregularidades, establecer responsabilidades y sostener auditorías. Es lo que convierte una pieza ' +
      'intercambiable en evidencia de una operación concreta.',
  },

  {
    id: 'industrias-que-usan-precintos',
    topic: 'precintos',
    q: [
      'que industrias usan precintos',
      'que sectores usan sellos de seguridad',
      'quienes compran precintos',
      'se usa en mi industria',
      'esto solo sirve para transporte',
    ],
    text:
      'Los usan transporte y logística, comercio exterior, industria manufacturera, hidrocarburos y ' +
      'combustibles, empresas de servicios públicos, salud y farmacéutico, recaudo y transporte de ' +
      'valores, aerolíneas y servicios aeroportuarios, centros de distribución y almacenamiento, y ' +
      'retail. Se asocian al transporte de carga, pero el uso va mucho más allá: válvulas, medidores, ' +
      'surtidores, carros de paro hospitalarios, trolleys de aerolíneas, tulas de recaudo y control de ' +
      'activos fijos.',
  },

  {
    id: 'tipos-de-precinto-por-material',
    topic: 'precintos',
    q: [
      'que tipos de precintos existen',
      'cuales son los tipos de sellos de seguridad',
      'diferencia entre precinto plastico metalico y de cable',
      'precinto metalico',
      'que precinto ofrece mayor nivel de seguridad',
      'cual es el precinto mas seguro',
      'precinto de alta seguridad',
    ],
    text:
      'Por material son cinco. El plástico es el más usado en control logístico, inventarios, transporte y ' +
      'tulas de recaudo. El metálico resiste más y va donde el riesgo o las condiciones son mayores. El de ' +
      'cable o guaya se adapta a distintos diámetros de cierre y suma resistencia. El de perno o botella ' +
      'es el de alta seguridad, certificado ISO/PAS 17712, para contenedores marítimos. El electrónico ' +
      'agrega monitoreo y rastreo satelital. El más seguro no es el adecuado para todo: depende del punto.',
  },

  {
    id: 'precintos-en-transporte-de-carga',
    topic: 'precintos',
    q: [
      'que precintos usan las empresas de transporte',
      'que precinto pongo en un camion',
      'precinto para furgon',
      'precinto para transporte de carga',
      'que usan los transportadores',
      'cross docking',
    ],
    text:
      'En transporte de carga se combinan varios: plásticos numerados en camiones y furgones de ' +
      'distribución, metálicos donde hace falta más resistencia, de cable o guaya en puntos de cierre con ' +
      'distintos diámetros, botella certificados ISO/PAS 17712 en contenedores marítimos, y electrónicos ' +
      'con GPS cuando se necesita monitoreo en tiempo real. Cubre camiones, carrotanques, contenedores, ' +
      'transporte multimodal, centros de distribución y cross docking.',
  },

  /* ---------------- Elegir: proveedor, criterio, precio ---------------- */

  {
    id: 'que-evaluar-antes-de-comprar',
    topic: 'precintos',
    q: [
      'que debo tener en cuenta antes de comprar',
      'como elijo un proveedor de precintos',
      'que le pregunto a un proveedor',
      'como se cual comprar',
    ],
    text:
      'Antes de comprar conviene definir seis cosas: qué activo o mercancía va a proteger, qué nivel de ' +
      'riesgo tiene la operación, qué trazabilidad necesita, si requiere personalización con logo, ' +
      'numeración o código de barras, qué certificaciones le exigen sus clientes o las autoridades, y qué ' +
      'cantidades maneja. Con eso resuelto la elección se acota sola. Si nos describe su operación le ' +
      'indicamos qué referencia corresponde a cada punto.',
  },

  /*
   * Este hecho existe para una pregunta concreta: "¿por qué uno vale más que
   * otro?". No es la pregunta del precio —esa la contesta el hecho `precios`,
   * que deriva al equipo comercial—, es la de qué mueve el precio. Se puede
   * contestar entera sin decir una sola cifra, y contestarla evita que el
   * modelo rellene el hueco con una.
   */
  {
    id: 'factores-del-precio',
    topic: 'cotizacion',
    q: [
      'de que depende el precio',
      'por que varia tanto el precio',
      'que hace que un precinto sea mas caro',
      'por que uno cuesta mas que otro',
      'relacion costo beneficio',
    ],
    text:
      'Lo que mueve el valor de un precinto es el tipo (plástico, metálico, guaya, botella o electrónico), ' +
      'los materiales, el nivel de seguridad requerido, la personalización con logo, numeración o código ' +
      'de barras, la cantidad, las certificaciones y la tecnología que incorpore. Comparar solo el valor ' +
      'unitario lleva a decisiones equivocadas: usar un nivel de seguridad inferior al necesario deja una ' +
      'vulnerabilidad, y uno superior encarece sin aportar nada.',
  },

  /*
   * Ojo con la pareja: `que-evaluar-antes-de-comprar` mira el PRODUCTO —qué
   * activo, qué riesgo, qué trazabilidad— y este mira al PROVEEDOR. Son dos
   * preguntas distintas que suenan igual ("¿cómo elijo?"), y separarlas evita
   * que quien pregunta por el segundo reciba la lista del primero.
   */
  {
    id: 'elegir-proveedor',
    topic: 'empresa',
    q: [
      'como elijo un proveedor confiable',
      'que debe ofrecer un proveedor de precintos',
      'cual es el mejor proveedor de precintos',
      'que busco en un proveedor',
      'como se cual proveedor es bueno',
    ],
    text:
      'Comparar solo el precio sale caro: un producto barato sin personalización, sin asesoría ni ' +
      'capacidad de suministro termina costando más en la operación. Vale la pena mirar la experiencia en ' +
      'seguridad y trazabilidad, que haya distintos tipos de precinto y niveles de seguridad, la ' +
      'personalización con logo, numeración y código de barras, la capacidad de atender tanto un pedido ' +
      'pequeño como un proyecto grande, y que entienda la operación antes de recomendar un producto.',
  },

  {
    id: 'suministro-por-volumen',
    topic: 'cotizacion',
    q: [
      'venden al por mayor',
      'que empresa vende precintos de seguridad al por mayor en colombia',
      'compras por volumen',
      'necesito grandes cantidades',
      'somos mayoristas',
      'abastecimiento permanente',
      'consumo mensual de precintos',
    ],
    text:
      'Sí, atendemos tanto pedidos pequeños como abastecimiento por volumen para operaciones permanentes ' +
      'de transporte, distribución, recaudo, comercio exterior y control de activos. Comprar por volumen ' +
      'permite estandarizar el precintado, mantener la numeración consecutiva bajo control y que todos los ' +
      'puntos usen la misma referencia. Cuéntenos su consumo estimado por período y coordinamos entregas ' +
      'programadas al cotizar.',
  },

  {
    id: 'enfoque-asesoria',
    topic: 'empresa',
    q: [
      'por que elegirlos a ustedes',
      'que los diferencia de otros proveedores',
      'ustedes asesoran',
      'me ayudan a escoger',
      'son un aliado',
    ],
    text:
      'No hay un precinto que sirva para todas las aplicaciones: un contenedor marítimo, una válvula, una ' +
      'tula de recaudo y un carrotanque tienen necesidades distintas. Por eso partimos de la operación y ' +
      'no del catálogo, y le recomendamos el nivel de seguridad que realmente necesita en lugar del ' +
      'producto más costoso. Atendemos proyectos de pequeña, mediana y gran escala, y acompañamos todo el ' +
      'proceso de compra.',
  },

  /* ---------------- Precinto botella e ISO/PAS 17712 ---------------- */

  /*
   * El bloque más importante de todo el archivo. Es el que corrige el error
   * que tenía el sitio —el botella puesto como solución de válvulas— y el que
   * contesta lo que preguntan los exportadores, que llegan con el requisito ya
   * impuesto por la naviera y sin saber cómo se llama.
   */
  {
    id: 'precinto-botella-que-es',
    topic: 'precintos',
    q: [
      'que es un precinto botella',
      'precinto de perno',
      'sello de perno',
      'precinto para contenedor maritimo',
      'que precinto uso para exportar',
      'precinto para exportacion',
      'precinto de mayor seguridad para contenedores',
    ],
    text:
      'El precinto botella o bolt seal es un sello de alta seguridad con cuerpo de acero y cierre tipo ' +
      'perno y cápsula, diseñado para contenedores marítimos, unidades de carga y comercio exterior. Es la ' +
      'referencia estándar en exportación e importación porque resiste los intentos de apertura y deja ' +
      'evidencia clara de manipulación. Lo suministramos certificado ISO/PAS 17712, con logo, numeración ' +
      'consecutiva y código de barras.',
  },

  {
    id: 'norma-iso-pas-17712',
    topic: 'precintos',
    q: [
      'que es la norma iso pas 17712',
      'iso 17712',
      'precinto certificado',
      'me piden un precinto certificado',
      'que certificacion exige la aduana',
      'que exige la naviera',
      'norma para sellos de contenedores',
    ],
    text:
      'La ISO/PAS 17712 es el estándar internacional que evalúa y clasifica los precintos de alta seguridad ' +
      'para contenedores marítimos y comercio exterior: certifica requisitos de resistencia física, ' +
      'identificación y desempeño. Se exige habitualmente en transporte marítimo internacional, ' +
      'exportaciones, importaciones y operaciones portuarias, porque permite usar un precinto reconocido ' +
      'en cualquier destino y agiliza inspecciones. Manejamos precintos botella certificados bajo esta ' +
      'norma.',
  },

  {
    id: 'quien-exige-botella-certificado',
    topic: 'precintos',
    q: [
      'que precinto exigen las navieras',
      'que pide la aduana',
      'agente de carga',
      'agencia de aduanas',
      'operador portuario',
      'requisitos de comercio exterior',
    ],
    text:
      'Navieras, autoridades aduaneras, agentes de carga, agencias de aduanas, operadores logísticos y ' +
      'portuarios y empresas exportadoras e importadoras trabajan con precintos botella o bolt seals ' +
      'certificados ISO/PAS 17712. Lo recomendable para esas operaciones es numeración única consecutiva, ' +
      'identificación permanente, logo corporativo y código de barras para el control aduanero y ' +
      'documental.',
  },

  {
    id: 'proteger-contenedor-maritimo',
    topic: 'usos',
    q: [
      'como proteger un contenedor maritimo',
      'como evitar el robo en un contenedor',
      'buenas practicas de sellado de contenedores',
      'que reviso antes de cargar un contenedor',
    ],
    text:
      'La protección empieza antes del puerto: verificar el estado físico del contenedor antes de cargar, ' +
      'inspeccionar puertas, bisagras y mecanismos de cierre, instalar un precinto botella certificado ' +
      'ISO/PAS 17712, registrar su numeración en los documentos de transporte, controlar el acceso durante ' +
      'cargue y descargue, verificar la integridad del precinto en cada punto de control y capacitar a ' +
      'quien instala y verifica. Para riesgo alto se refuerza con precintos de guaya en barras y ' +
      'compartimientos y con etiquetas de seguridad.',
  },

  /* ---------------- Precintos plásticos ---------------- */

  /*
   * Las aplicaciones raras del plástico —extintores, arneses, jeans— no están
   * de adorno. Son las que traen a gente que no se considera "del sector
   * logístico" y que jamás buscaría "precinto de seguridad": buscan cómo
   * marcar un extintor o cómo controlar la ropa de una lavandería.
   */
  {
    id: 'precintos-plasticos-aplicaciones',
    topic: 'precintos',
    q: [
      'para que sirve un precinto plastico',
      'sello plastico de seguridad',
      'marchamo plastico',
      'precinto para extintores',
      'identificacion de equipos de calibracion',
      'control de arneses y eslingas',
      'trabajo en alturas',
      'marcacion de cables y mangueras',
      'precintos para lavanderia',
      'identificacion de prendas',
      'industria textil y calzado',
    ],
    text:
      'El precinto plástico es el más usado por su facilidad de instalación y su bajo costo operativo. ' +
      'Además de camiones, tulas de recaudo, carrotanques, mixers, cajas de seguridad, trolleys de ' +
      'aerolínea, gavetas y centros de distribución, se usa para marcar cables, mangueras y tuberías, ' +
      'identificar y controlar extintores, equipos sometidos a calibración y herramientas para trabajo en ' +
      'alturas, y para identificación de prendas en lavanderías, tintorerías, industria textil y calzado.',
  },

  {
    id: 'precintos-plasticos-sectores',
    topic: 'sectores',
    q: [
      'que sectores usan precintos plasticos',
      'trabajan con cementeras',
      'concretera',
      'mensajeria y paqueteria',
      'aerolineas',
      'retail',
      'trabajan con mi industria',
    ],
    text:
      'Suministramos precintos plásticos a transporte de carga, operadores logísticos, industria ' +
      'manufacturera, cementeras y concreteras, recaudo y transporte de valores, aerolíneas, retail y ' +
      'comercio, mensajería y paquetería, industria farmacéutica y alimentaria, petróleo e hidrocarburos, ' +
      'combustibles líquidos, minería y carbón, industria textil y calzado, y empresas de calibración de ' +
      'equipos y trabajos en alturas.',
  },

  {
    id: 'elegir-precinto-plastico',
    topic: 'precintos',
    q: [
      'como elijo un precinto plastico',
      'que largo de precinto necesito',
      'precinto ajustable o de longitud fija',
      'que precinto plastico me conviene',
    ],
    text:
      'Para elegir un precinto plástico mire el punto de aplicación, el nivel de seguridad requerido, la ' +
      'longitud necesaria, la resistencia a la manipulación, las condiciones ambientales de uso, si ' +
      'necesita numeración consecutiva o código de barras, la personalización con logo y el volumen de ' +
      'consumo. Manejamos referencias ajustables y de longitud fija; el error más común es escoger solo ' +
      'por precio y quedarse corto en resistencia o en longitud.',
  },

  /* ---------------- Precintos de cable o guaya ---------------- */

  {
    id: 'guaya-cuando-usarla',
    topic: 'precintos',
    q: [
      'cuando uso una guaya en vez de un plastico',
      'precinto de cable',
      'el orificio es muy pequeño',
      'necesito mas resistencia',
      'precinto para valvulas',
      'precinto para surtidores',
      'precinto para medidores',
      'precinto para balanzas',
    ],
    text:
      'El precinto de cable o guaya conviene cuando hace falta más resistencia a la rotura que la de un ' +
      'plástico, cuando el punto de cierre tiene un orificio pequeño, cuando el precinto queda expuesto a ' +
      'condiciones exigentes o cuando hay que identificar individualmente un equipo. Por eso es el ' +
      'habitual en carrotanques, válvulas y puntos de cierre, surtidores de estaciones de servicio, ' +
      'medidores, balanzas y equipos de pesaje, maquinaria industrial y control de herramientas para ' +
      'trabajo en alturas, como arneses y eslingas.',
  },

  {
    id: 'guaya-como-elegirla',
    topic: 'precintos',
    q: [
      'que diametro de guaya necesito',
      'que longitud de guaya',
      'todas las guayas resisten igual',
      'como elijo un precinto de cable',
    ],
    text:
      'No todas las guayas ofrecen la misma resistencia: depende del diámetro del cable, del material y la ' +
      'construcción, del diseño del cuerpo y el mecanismo de bloqueo y de la longitud. Para elegir mire el ' +
      'punto de aplicación, el diámetro del orificio —que determina el grosor de cable que cabe—, la ' +
      'resistencia que pide el riesgo, la longitud necesaria para cerrar sin holguras, las condiciones ' +
      'ambientales y la frecuencia de inspección del activo.',
  },

  /* ---------------- Precintos electrónicos ---------------- */

  {
    id: 'precinto-electronico-que-es',
    topic: 'precintos',
    q: [
      'que es un precinto electronico',
      'precinto con gps',
      'precinto satelital',
      'rastreo de la carga en tiempo real',
      'monitoreo de contenedores',
    ],
    text:
      'El precinto electrónico combina el sellado de la carga con monitoreo, localización y trazabilidad ' +
      'durante el trayecto, en lugar de verificar el sello solo al llegar. Según el modelo y la ' +
      'plataforma, permite conocer la ubicación en tiempo real, seguir el recorrido, detectar aperturas o ' +
      'manipulaciones, identificar desviaciones de ruta, registrar paradas prolongadas y consultar el ' +
      'historial del viaje. Se usa sobre todo en contenedores de importación y exportación y en mercancía ' +
      'de alto valor.',
  },

  {
    id: 'precinto-electronico-alertas',
    topic: 'precintos',
    q: [
      'que alertas da un precinto electronico',
      'avisa si abren el contenedor',
      'detecta desvio de ruta',
      'paradas no programadas',
      'geocerca',
    ],
    text:
      'Según el dispositivo y la plataforma, un precinto electrónico puede registrar y alertar sobre ' +
      'apertura o manipulación del precinto, intentos de intervención, cambios o desviaciones de la ruta ' +
      'establecida, paradas no programadas, permanencia excesiva en un mismo lugar, ubicación durante el ' +
      'recorrido, entrada o salida de zonas configuradas e historial de desplazamientos y eventos. La ' +
      'ventaja es poder reaccionar mientras la mercancía sigue en tránsito.',
  },

  {
    id: 'precinto-electronico-como-elegirlo',
    topic: 'precintos',
    q: [
      'como elijo un precinto electronico',
      'cuanto dura la bateria',
      'que cobertura tiene',
      'que plataforma de monitoreo usan',
      'cada cuanto reporta la ubicacion',
    ],
    text:
      'Para elegir un precinto electrónico defina primero qué necesita saber durante el viaje. Los ' +
      'criterios son el tipo de transporte, el tipo y valor de la mercancía, la ruta y la distancia, la ' +
      'cobertura de comunicación en el trayecto, la frecuencia de localización, la autonomía de batería ' +
      'que exige el recorrido, los eventos de seguridad que necesita registrar, el control de ruta, la ' +
      'plataforma de consulta y el historial. El dispositivo con más funciones no siempre es el adecuado.',
  },

  /* ---------------- Etiquetas y cintas de seguridad ---------------- */

  /*
   * El sitio ya lista las referencias de etiquetas, pero no explicaba la
   * diferencia entre tecnologías, que es exactamente lo que decide la compra:
   * la No Transfer no es "otra VOID", es la que se usa cuando la superficie no
   * puede quedar marcada, y ese matiz es el que hace que un cliente de carros
   * nuevos compre o no compre.
   */
  {
    id: 'tipos-de-etiquetas-seguridad',
    topic: 'etiquetas',
    q: [
      'que tipos de etiquetas de seguridad hay',
      'diferencia entre void y opened',
      'etiqueta no transfer',
      'etiqueta cascara de huevo',
      'etiqueta destructible',
      'etiqueta holografica',
      'cual etiqueta me sirve',
    ],
    text:
      'Hay cinco tecnologías y se eligen por el tipo de evidencia que necesita. Las VOID dejan la palabra ' +
      'VOID o un patrón de seguridad al retirarlas. Las OPENED muestran el mensaje de apertura. Las No ' +
      'Transfer dejan la evidencia solo en la etiqueta y la superficie queda limpia. Las de cáscara de ' +
      'huevo son de material destructible y se fragmentan, así que no pueden reutilizarse. Las ' +
      'holográficas ayudan a acreditar autenticidad y son difíciles de reproducir.',
  },

  {
    id: 'etiquetas-no-transfer-vehiculos',
    topic: 'etiquetas',
    q: [
      'etiqueta para vehiculos nuevos',
      'camion portavehiculos',
      'nodriza',
      'etiqueta que no deje residuo',
      'etiqueta que no dañe la superficie',
      'sellar sin marcar la pintura',
    ],
    text:
      'Cuando la superficie no puede quedar marcada, la solución es la etiqueta No Transfer: la evidencia ' +
      'de manipulación queda en la propia etiqueta y la superficie permanece limpia, sin mensaje ni ' +
      'residuo. Es la que se usa en vehículos nuevos transportados en camiones portavehículos o nodrizas, ' +
      'y también en puertas, puntos de acceso, equipos y activos cuya presentación debe conservarse.',
  },

  {
    id: 'etiquetas-holograficas-autenticidad',
    topic: 'etiquetas',
    q: [
      'etiqueta contra falsificacion',
      'para que no falsifiquen mi producto',
      'como acredito que mi producto es original',
      'proteccion de marca',
      'etiqueta para medicamentos',
      'etiqueta para cosmeticos',
      'etiqueta para celulares',
      'sello de originalidad',
    ],
    text:
      'Las etiquetas holográficas incorporan elementos visuales difíciles de reproducir, así que ayudan a ' +
      'identificar productos originales y a dificultar la sustitución o falsificación del sello. Se usan ' +
      'sobre todo en industria farmacéutica, cosméticos y productos de belleza, celulares y accesorios, ' +
      'equipos electrónicos, repuestos y componentes, y productos de marca o de alto valor. Según su ' +
      'fabricación, pueden además incorporar tecnología tamper evident.',
  },

  {
    id: 'cintas-de-seguridad',
    topic: 'etiquetas',
    q: [
      'cinta de seguridad para cajas',
      'cinta para domicilios',
      'sellar paquetes de ecommerce',
      'cinta que diga abierto',
      'cinta tamper evident',
      'proteger encomiendas',
    ],
    text:
      'La cinta de seguridad protege cajas, paquetes, embalajes y domicilios dejando evidencia visible si ' +
      'alguien los abre antes de llegar al destinatario: según la referencia, al retirarla aparece un ' +
      'mensaje como VOID, OPENED o ABIERTO. Es especialmente útil en comercio electrónico, mensajería, ' +
      'distribución y despachos desde centros de distribución, porque permite al cliente verificar de un ' +
      'vistazo si el empaque conserva el cierre puesto en origen.',
  },

  {
    id: 'etiqueta-o-cinta',
    topic: 'etiquetas',
    q: [
      'me conviene etiqueta o cinta',
      'como elijo una etiqueta de seguridad',
      'sobre que superficies pegan',
      'que etiqueta uso para cada aplicacion',
    ],
    text:
      'La etiqueta resuelve puntos específicos de control: activos, equipos, garantías, productos, puertas ' +
      'y superficies concretas. La cinta es para cierres de mayor longitud, como cajas, paquetes y ' +
      'embalajes. Para decidir, mire la superficie —vidrio, metal, plástico o cartón—, la aplicación, el ' +
      'tipo de evidencia que necesita, el tamaño del área, las condiciones de almacenamiento y transporte, ' +
      'la personalización y si la superficie debe quedar limpia.',
  },

  {
    id: 'etiqueta-vs-sello-de-garantia',
    topic: 'etiquetas',
    q: [
      'que es un sello de garantia',
      'diferencia entre etiqueta de seguridad y etiqueta normal',
      'etiqueta para garantia de equipos',
      'sello para electrodomesticos',
    ],
    text:
      'Una etiqueta convencional informa o identifica, pero no está hecha para dejar rastro al retirarse. ' +
      'Una etiqueta de seguridad sí: evidencia el retiro, la apertura o la manipulación. El sello de ' +
      'garantía es una aplicación concreta de la etiqueta de seguridad, instalada sobre el punto de acceso ' +
      'de un producto o equipo —electrónicos, celulares, electrodomésticos, equipos técnicos, repuestos— ' +
      'para verificar si fue abierto según las condiciones de garantía de la empresa.',
  },

  {
    id: 'etiquetas-control-de-activos',
    topic: 'etiquetas',
    q: [
      'etiqueta para control de activos',
      'marcar equipos de la empresa',
      'inventario de equipos',
      'vigilancia y seguridad privada',
      'sellar gabinetes y puertas',
    ],
    text:
      'Las etiquetas de seguridad sirven para identificar equipos, herramientas y bienes de la empresa y ' +
      'evidenciar intentos de retiro o sustitución, y pueden llevar logo, numeración consecutiva, código ' +
      'de barras, información de identificación y mensajes de seguridad. Las empresas de vigilancia y ' +
      'seguridad privada las usan además para evidenciar aperturas en puertas, vehículos, gabinetes, ' +
      'equipos y cajas bajo supervisión.',
  },

  {
    id: 'personalizacion-etiquetas-y-cintas',
    topic: 'etiquetas',
    /*
     * Deliberadamente sin "logo de mi empresa": esa pregunta, hecha en seco,
     * es sobre los precintos y ya la contesta el hecho general de
     * personalización. Aquí las `q` nombran siempre la etiqueta o la cinta,
     * que es lo que distingue a este hecho del otro.
     */
    q: [
      'las etiquetas se pueden personalizar',
      'cinta de seguridad personalizada',
      'etiqueta con numeracion',
      'etiqueta impresa con logo',
    ],
    text:
      'Según el material y la referencia, las etiquetas y cintas de seguridad se personalizan con logo o ' +
      'nombre de la empresa, numeración consecutiva, código de barras, textos y mensajes de advertencia, ' +
      'información para identificación de activos y elementos gráficos de seguridad. Personalizarlas ' +
      'dificulta que alguien las sustituya por un sello genérico y hace el embalaje identificable en el ' +
      'despacho y la recepción.',
  },
];
