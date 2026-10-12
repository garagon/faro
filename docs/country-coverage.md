# Cobertura por país / Country coverage

Revisión de esta ampliación: 12 de octubre de 2026. Los campos `reviewedAt` conservan la fecha de revisión de cada fuente. Una revisión editorial no garantiza disponibilidad del sitio ni vigencia operativa de un servicio. Algunas fuentes oficiales bloquearon la lectura automatizada; su contenido se contrastó mediante el índice de búsqueda oficial. No se hicieron llamadas de prueba.

| Destino        | Teléfonos incluidos | Autoridad / preparación                   | Red sísmica enlazada            | Sismos dentro de Faro |
| -------------- | ------------------- | ----------------------------------------- | ------------------------------- | --------------------- |
| Panamá         | 911                 | SINAPROC                                  | IGC · Universidad de Panamá     | IGC o USGS            |
| Chile          | 131, 132, 133       | SENAPRED; planos de evacuación            | CSN · Universidad de Chile      | USGS                  |
| Colombia       | 123                 | UNGRD                                     | Servicio Geológico Colombiano   | USGS                  |
| Argentina      | 911, 100, 103       | SINAGIR                                   | INPRES                          | USGS                  |
| Estados Unidos | 911                 | Ready.gov · FEMA                          | USGS                            | USGS                  |
| México         | 911                 | Coordinación Nacional de Protección Civil | SSN · UNAM                      | USGS                  |
| Perú           | 105, 116, 106       | INDECI                                    | IGP · CENSIS                    | USGS                  |
| Ecuador        | 911                 | Secretaría Nacional de Gestión de Riesgos | IG · EPN                        | USGS                  |
| Costa Rica     | 911                 | Comisión Nacional de Emergencias          | RSN · Universidad de Costa Rica | USGS                  |

- Los teléfonos cortos se usan dentro del país. Perú: SAMU 106 tiene cobertura regional; el dato y la interfaz remiten a la lista de regiones de la fuente oficial. Argentina: no se presenta el SAME 107 como servicio nacional.
- Los enlaces a las redes nacionales abren sus sitios. Sus datos no se agregan al mapa de USGS. IGC y USGS mantienen sus catálogos separados; la red nacional puede publicar más sismos pequeños.
- Los rectángulos del mapa son áreas aproximadas. Chile y Argentina usan vistas continentales más extensas; EE. UU. inicia en los estados contiguos y lo indica explícitamente. Para Alaska, Hawái, islas u otros territorios, desplaza el mapa y usa «Buscar en esta área». Ecuador incluye Galápagos en su área inicial. Ninguno de estos rectángulos acredita jurisdicción, fronteras ni riesgo.
- Asistencia consular en Panamá: 24 fichas con fuentes oficiales actuales (algunas solo enlazan al organismo) y 26 referencias históricas del directorio europeo de octubre de 2024, separadas y sin rutas ni teléfonos. La cobertura no es exhaustiva. Hay seis marcadores de edificios documentados; España queda sin ruta ni marcador por el traslado provisional pendiente de confirmar. Para otras combinaciones de destino/nacionalidad se muestran directorios oficiales cuando hay uno documentado. Sin una dirección verificada no se añade un marcador.
- Refugios y voluntariado: no hay disponibilidad operativa confirmada en Faro. Los enlaces institucionales no son una lista de centros abiertos.
- Otros países: selector y catálogo USGS disponibles; teléfonos y directorio local pueden faltar. La interfaz lo dice expresamente. No se inventa un número de emergencia por defecto.
- NOAA/PTWC: se mantienen los productos internacionales configurados y sus límites de cobertura. Cambiar de país no los convierte en un sistema local de alertas. Se enlaza la autoridad del destino y las fechas se muestran en la zona horaria del dispositivo.

## Fuentes de los cuatro destinos añadidos

- México: [911](https://www.gob.mx/911/articulos/servicio-de-atencion-de-llamadas-de-emergencias-9-1-1?idiom=es), [Protección Civil](https://www.gob.mx/sspc/acciones-y-programas/coordinacion-nacional-de-proteccion-civil-357857), [SSN](https://www.ssn.unam.mx/sismicidad/ultimos/).
- Perú: [teléfonos y alcance regional](https://www.gob.pe/547-telefonos-de-emergencia), [INDECI](https://www.gob.pe/indeci), [CENSIS](https://censis.igp.gob.pe/).
- Ecuador: [ECU 911](https://www.ecu911.gob.ec/gestion-de-la-atencion-de-emergencias/), [Gestión de Riesgos](https://www.gestionderiesgos.gob.ec/), [IG · EPN](https://www2.igepn.edu.ec/mapa-ultimos-sismos).
- Costa Rica: [sistema 911, Poder Judicial](https://diccionariousual.poder-judicial.go.cr/index.php/diccionario/sistema-de-emergencias-9-1-1), [CNE](https://www.cne.go.cr/), [RSN](https://rsn.ucr.ac.cr/).

## Extensión

Un archivo tipado por destino y una entrada en el registro. Ver [pasos y pruebas](extending-faro.md#add-or-improve-country-coverage). Las fuentes, fechas y restricciones forman parte de los datos; no deben quedar ocultas en componentes o textos fijos.

## Preparación y atención de salud

- Mochila: 14 elementos con lista local descargable en ES/EN, basada en SENAPRED; la batería externa se identifica como complemento de Faro. Las ilustraciones vectoriales son originales, no material oficial.
- Farmacias y hospitales: búsquedas explícitas en Google Maps por dirección o ubicación aproximada. No son una integración de disponibilidad, horarios de guardia ni triaje. Enlaces oficiales: MINSA en Panamá y Visor Preparado de SENAPRED en Chile.
- Evacuación: se corrigieron los enlaces de SENAPRED. No se verificó físicamente ninguna ruta, calle, salida de hotel ni punto seguro. Los planos chilenos solo se muestran para Chile.
- El PDF de cuerpo diplomático enlazado por la Cancillería de Panamá devolvió 404 durante esta revisión. No se transcribió como una lista completa vigente.
