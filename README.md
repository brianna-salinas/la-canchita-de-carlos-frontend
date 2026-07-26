<div align="center">

<br>

**Presented by**

<img src="assets/oryon/oryon.png" alt="Oryon" width="140"/>

<br>

## Sistema de Gestión de Alquiler de Canchas

# La Canchita de Carlos

<img src="assets/styles/logo.png" alt="Logo La Canchita de Carlos" width="200"/>

<br>

## Project Documentation 
### Propuesta 1 - Uso Interno



| | |
|---|---|
| **Cliente** | Carlos Maldonado |
| **Desarrollado por** | Oryon — Soluciones Tecnológicas |
| **Responsable del proyecto** | Brianna Salinas |
| **Plazo** | 2 semanas (documentación, diseño, prototipo, desarrollo, pruebas y despliegue) |
| **Producto** | [lacanchitadecarlos.moli-voleibol.com](https://lacanchitadecarlos.moli-voleibol.com/) |

<br>
<br>

### **Julio 2026**

<br>

</div>


---

# Tabla de Contenidos

[About the Product](#about-the-product)

[Capítulo I: Introducción](#capítulo-i-introducción)
* [1.1. Perfil del negocio](#11-perfil-del-negocio)
* [1.2. Alcance del producto](#12-alcance-del-producto)
* [1.3. Objetivos del proyecto](#13-objetivos-del-proyecto)
* [1.4. Usuarios del sistema](#14-usuarios-del-sistema)

[Capítulo II: Especificación de Requisitos](#capítulo-ii-especificación-de-requisitos)
* [2.1. Requisitos Funcionales](#21-requisitos-funcionales)
* [2.2. Requisitos No Funcionales](#22-requisitos-no-funcionales)
* [2.3. Lenguaje Ubicuo](#23-lenguaje-ubicuo)
* [2.4. User Stories](#24-user-stories)
* [2.5. Product Backlog](#25-product-backlog)

[Capítulo III: Diseño de Producto (UX/UI)](#capítulo-iii-diseño-de-producto-uxui)
* [3.1. Arquitectura de Información](#31-arquitectura-de-información)
* [3.2. Style Guideliness](#32-style-guideliness)
* [3.3. Wireframes y Mockups](#33-wireframes-y-mockups)
* [3.4. Prototipo en Figma](#34-prototipo-en-figma)

[Capítulo IV: Arquitectura de Software (Domain-Driven Design)](#capítulo-iv-arquitectura-de-software-domain-driven-design)
* [4.0. Patrón de Arquitectura](#40-patrón-de-arquitectura)
* [4.1. Design-Level Event Storming](#41-design-level-event-storming)
* [4.2. Bounded Contexts y Context Map](#42-bounded-contexts-y-context-map)
* [4.3. Software Architecture Context Diagram](#43-software-architecture-context-diagram)
* [4.4. Software Architecture Container Diagram](#44-software-architecture-container-diagram)
* [4.5. Software Architecture Components Diagrams](#45-software-architecture-components-diagrams)
* [4.6. Cloud Architecture (PWA)](#46-cloud-architecture-pwa)
* [4.7. Análisis Técnico-Económico de la Infraestructura](#47-análisis-técnico-económico-de-la-infraestructura)
* [4.8. Diagrama de Secuencia](#48-diagrama-de-secuencia)

[Capítulo V: Software Object-Oriented Design](#capítulo-v-software-object-oriented-design)
* [5.1. Class Diagrams - Backend](#51-class-diagrams--backend)
* [5.2. Class Diagrams - Frontend](#52-class-diagrams--frontend)

[Capítulo VI: Database Design](#capítulo-vi-database-design)
* [6.1. Modelo Entidad-Relación](#61-modelo-entidad-relación)
* [6.2. Database Diagrams](#62-diagrama-de-base-de-datos)
* [6.3. Diccionario de Datos](#63-diccionario-de-datos)

[Capítulo VII: Gestión del Proyecto](#capítulo-vii-gestión-del-proyecto)
* [7.1. Plan de Sprints](#71-plan-de-sprints)
* [7.2. Sprint 1](#72-sprint-1)
* [7.3. Sprint 2](#73-sprint-2)
* [7.4. Definition of Done](#74-definition-of-done)

[Capítulo VIII: Implementación](#capítulo-viii-implementación)
* [8.1. Configuración del Entorno de Desarrollo](#81-configuración-del-entorno-de-desarrollo)
* [8.2. Gestión de Código Fuente](#82-gestión-de-código-fuente)
* [8.3. Convenciones de Código](#83-convenciones-de-código)
* [8.4. Configuración de Despliegue](#84-configuración-de-despliegue)
* [8.5. Avance por Sprint](#85-avance-por-sprint)
* [8.6. JSON Server (Fake API)](#86-json-server-fake-api)

[Capítulo IX: Pruebas y Validación](#capítulo-ix-pruebas-y-validación)
* [9.1. Estrategia de Pruebas](#91-estrategia-de-pruebas)
* [9.2. Casos de Prueba Clave](#92-casos-de-prueba-clave)
* [9.3. Validación con el Cliente](#93-validación-con-el-cliente)

[Capítulo X: Despliegue](#capítulo-x-despliegue)
* [10.1. Ambiente de Producción](#101-ambiente-de-producción)
* [10.2. Checklist de Despliegue](#102-checklist-de-despliegue)
* [10.3. Plan de Rollback](#103-plan-de-rollback)

[Anexos](#anexos)

<br>

---

# About the Product

<div align="center">

**La Canchita de Carlos** — Sistema de Gestión de Alquiler de Canchas

<br>

[Ver video del producto](AÑADIR-LINK-DEL-VIDEO-AQUÍ)

<br>

*Video demostrativo del sistema funcionando en producción: inicio de sesión, calendario de disponibilidad, registro de un alquiler, registro de pago y panel operativo del día.*

</div>

<br>

---

# Capítulo I: Introducción

## 1.1. Perfil del negocio

"La Canchita de Carlos" opera dentro de la Institución Educativa N.° 1278 Mixto La Molina (Jr. Cusco 416, La Molina, Lima), donde Carlos Maldonado administra el alquiler de las canchas deportivas del plantel (vóley, fútbol y básquet, cinco espacios en total) fuera del horario escolar. Este modelo permite aprovechar la infraestructura deportiva del colegio como fuente de ingreso adicional, alquilando las canchas a equipos, grupos e instituciones externas en las tardes, noches y fines de semana.

Actualmente, la gestión de las reservas se realiza de forma manual: los horarios se coordinan por llamadas o mensajes, los pagos se registran en cuadernos o notas sueltas (efectivo, Yape), y no existe un sistema centralizado que Carlos y su trabajador puedan consultar en tiempo real. Esto genera dos problemas recurrentes: dobles reservas de una misma cancha en el mismo horario (con el consecuente conflicto frente a los clientes) y falta de visibilidad clara sobre cuánto se ha alquilado, cuánto se ha cobrado y qué pagos quedan pendientes en un día determinado.

El sistema busca resolver esto centralizando la gestión de las cinco canchas en una sola herramienta accesible desde el celular o la computadora, exclusiva para Carlos y su trabajador, sin exponer el sistema a los clientes finales (alcance definido en la Propuesta 1).

<br>

## 1.2. Alcance del producto

El presente documento desarrolla la **Propuesta 1 — Uso interno**, aceptada por el cliente sobre la Propuesta 2, en función del plazo real disponible (2 semanas) y el presupuesto acordado. El sistema es de uso exclusivo de Carlos y por trabajadores autorizados por el mismo; los clientes finales no acceden a la aplicación ni realizan reservas ni pagos por este medio.

<br>

**Incluido en el alcance:**

- Gestión de usuarios administradores (inicio de sesión seguro, múltiples administradores, control de acceso a los administradores desde la cuenta principal).

- Gestión de alquileres: calendario de disponibilidad (diario/semanal/mensual), registro/edición/cancelación, bloqueo automático de horarios ocupados, bloqueo manual por mantenimiento con motivo, historial con búsqueda y filtros.

- Gestión de clientes: registro (incluyendo DNI/RUC), edición, eliminación e historial básico.

- Gestión de las cinco canchas: alta y edición, configuración de precios, vista general de disponibilidad, fotos.

- Gestión de pagos: estado (pagado/pendiente), pagos parciales, método de pago — registrados manualmente por el administrador (efectivo, Yape, etc.), sin pasarela de pago integrada.

- Panel principal con alquileres, ingresos y pagos pendientes del día.
- Aplicación PWA instalable, con diseño responsive optimizado para uso desde celular.

<br>

**Explícitamente fuera de alcance en esta fase:**
- Acceso o reservas por parte de clientes finales (celular/tablet/PC de los clientes).

- Pago online con tarjeta o pasarela de pagos.

- Notificaciones automáticas (correo, WhatsApp, recordatorios).

- Reportes exportables en PDF/Excel más allá del panel del día.

Estos puntos corresponden íntegramente a la **Propuesta 2 — Plataforma con clientes**, la cual queda documentada como fase de evolución futura del sistema y no forma parte del desarrollo actual. La arquitectura definida en el Capítulo IV se diseña de modo que esta segunda fase sea una extensión y no un rediseño del sistema.

<br>

## 1.3. Objetivos del proyecto

**Objetivo general**

Diseñar e implementar un sistema PWA de gestión de alquiler de canchas para "La Canchita de Carlos", que centralice la administración de alquileres, clientes, canchas y pagos en una sola herramienta de uso interno, eliminando la doble reserva de horarios y dando visibilidad diaria de la operación del negocio.

## 1.4. Usuarios del sistema

El sistema tiene un único rol funcional, **Administrador**, asignado a dos personas con el mismo nivel de acceso, sin jerarquía entre ellas dentro de la aplicación:

<br>

| Usuario | Rol | Responsabilidades principales |
|---|---|---|
| Carlos Maldonado | Administrador / dueño | Gestión general del negocio: precios de canchas, revisión de ingresos y pendientes, alta de nuevos administradores si fuera necesario. |
| Trabajador autorizado | Administrador secundario | Operación del día a día: registrar y confirmar alquileres, atender llamadas/mensajes de clientes y reflejarlos en el sistema, registrar pagos. |

<br>

No existe un rol de "cliente" dentro del sistema en esta fase los clientes de Carlos no inician sesión ni interactúan directamente con la aplicación, solo son gestionados como registros dentro del módulo de clientes. Este punto es clave para el diseño de la autenticación (RF01–RF03): basta con un control de acceso simple de 2 usuarios, sin necesidad de un sistema de roles complejo en esta etapa.

<br>

---

# Capítulo II: Especificación de Requisitos

## 2.1. Requisitos Funcionales

Requisitos derivados del alcance definido, agrupados por módulo (bounded context), con prioridad asignada según su criticidad para resolver el problema central del negocio: la doble reserva y la falta de visibilidad de ingresos.

<br>

**Módulo: Gestión de usuarios**

| ID | Descripción | Prioridad |
|---|---|---|
| RF01 | El sistema debe permitir el inicio de sesión de un administrador mediante correo/usuario y contraseña, validando credenciales antes de dar acceso. | Alta |
| RF02 | El sistema debe soportar al menos 2 cuentas de administrador (Carlos y su trabajador) operando de forma independiente y simultánea. | Alta |
| RF03 | El sistema debe restringir el acceso a la información únicamente a usuarios autenticados; ninguna ruta de datos debe ser accesible sin sesión válida. | Alta |

<br>

**Módulo: Gestión de alquileres**

| ID | Descripción | Prioridad |
|---|---|---|
| RF04 | El sistema debe mostrar un calendario de disponibilidad de las 5 canchas en vista diaria, semanal y mensual. | Alta |
| RF05 | El sistema debe permitir registrar, editar y cancelar un alquiler, asociándolo a una cancha, un cliente, una fecha y un horario. | Alta |
| RF33 | El sistema debe permitir registrar el tipo de reserva (pichanga, torneo, evento) y un nombre de equipo o grupo, distinto del nombre del cliente registrado, al momento de registrar un alquiler. | Media |
| RF06 | El sistema debe impedir el registro de un nuevo alquiler si la cancha ya tiene un alquiler activo en el mismo horario (regla central del negocio). | Alta — crítica |
| RF07 | El sistema debe permitir bloquear manualmente un horario de una cancha por motivo de mantenimiento, excluyéndolo de la disponibilidad. | Media |
| RF32 | El sistema debe permitir registrar un motivo o nota de texto al bloquear manualmente una franja horaria por mantenimiento, visible al consultar la franja bloqueada. | Media |
| RF08 | El sistema debe mantener un historial de alquileres, con filtros por fecha, cancha, cliente y estado. | Media |
| RF26 | Si el cliente de un alquiler no existe aún en el sistema, el formulario de registro de alquiler debe permitir crearlo ahí mismo (nombre, contacto) sin salir de la pantalla, y usarlo de inmediato para el alquiler. | Media |

<br>

**Módulo: Gestión de clientes**

| ID | Descripción | Prioridad |
|---|---|---|
| RF09 | El sistema debe permitir registrar, editar y eliminar clientes (nombre, DNI o RUC, contacto, correo opcional) — DNI para persona natural, RUC para persona jurídica/institución (equipos, colegios, empresas que alquilan). | Media |
| RF10 | El sistema debe mostrar el historial básico de alquileres asociado a cada cliente. | Baja |
| RF30 | El sistema debe permitir registrar el número de WhatsApp del cliente y ofrecer un acceso directo (abrir chat de WhatsApp) desde su ficha o desde el detalle de un alquiler. | Media |

<br>

**Módulo: Gestión de canchas**

| ID | Descripción | Prioridad |
|---|---|---|
| RF11 | El sistema debe permitir dar de alta, editar y dar de baja canchas (nombre, disciplina: vóley/fútbol/básquet). El catálogo actual tiene 5, pero el sistema no debe asumir ese número como fijo — Carlos puede agregar o retirar canchas sin soporte técnico. | Alta |
| RF12 | El sistema debe permitir configurar el precio por cancha, y opcionalmente por franja horaria. | Media |
| RF13 | El sistema debe mostrar una vista general de disponibilidad consolidada de todas las canchas. | Alta |
| RF31 | El sistema debe permitir adjuntar una o más fotos a cada cancha, para identificarla visualmente al momento de alquilar. | Media |

<br>

**Módulo: Gestión de pagos**

| ID | Descripción | Prioridad |
|---|---|---|
| RF14 | El sistema debe permitir registrar el estado de pago de un alquiler (pagado / pendiente). | Alta |
| RF15 | El sistema debe permitir registrar pagos parciales, indicando el monto abonado y el saldo restante. | Media |
| RF16 | El sistema debe permitir registrar el método de pago utilizado (efectivo, Yape, u otro). | Baja |
| RF25 | El sistema debe permitir adjuntar una imagen de comprobante (captura de Yape, foto de voucher, etc.) al registrar un pago total o parcial. | Media |

<br>

**Módulo: Panel principal**

| ID | Descripción | Prioridad |
|---|---|---|
| RF17 | El sistema debe mostrar en el panel principal los alquileres registrados para el día actual. | Alta |
| RF18 | El sistema debe calcular y mostrar el ingreso total del día en base a los pagos registrados. | Alta |
| RF19 | El sistema debe mostrar el listado de pagos pendientes del día. | Alta |

<br>

**Módulo: Registro y autorización de administradores**

| ID | Descripción | Prioridad |
|---|---|---|
| RF20 | El sistema debe permitir que una persona registre una solicitud de cuenta de administrador (nombre, correo), quedando en estado pendiente sin acceso al sistema. | Media |
| RF21 | El sistema debe permitir que únicamente el administrador dueño visualice, autorice o rechace solicitudes de cuenta pendientes. | Media |
| RF22 | El sistema debe notificar (correo simple) al solicitante si su cuenta fue autorizada o rechazada. | Baja |
| RF27 | El sistema debe permitir que el administrador dueño vea el listado de cuentas de administrador activas (no solo las pendientes de autorizar). | Baja |

<br>

**Módulo: Confirmación por correo**

| ID | Descripción | Prioridad |
|---|---|---|
| RF23 | El sistema debe enviar automáticamente un correo de confirmación al cliente cuando se registra un `Booking`, siempre que el cliente tenga un correo registrado (RF09). | Media |
| RF24 | Si el envío de correo falla, el sistema no debe bloquear ni revertir el registro del `Booking` — el correo es una notificación adicional, no una condición del negocio. | Media |

<br>

**Módulo: Ajustes de cuenta**

| ID | Descripción | Prioridad |
|---|---|---|
| RF28 | El sistema debe permitir que un administrador autenticado actualice su propio correo. | Baja |
| RF29 | El sistema debe permitir que un administrador autenticado cambie su propia contraseña, solicitando la contraseña actual como verificación. | Media |

<br>

## 2.2. Requisitos No Funcionales

Requisitos de calidad del sistema, con criterio medible cuando aplica, alineados a la infraestructura definida en la documentación.

<br>

| ID | Categoría | Descripción | Criterio de aceptación |
|---|---|---|---|
| RNF01 | Seguridad | Autenticación de administradores y protección de rutas de datos. | Contraseñas hasheadas con bcrypt; sesión mediante JWT con expiración; todo el tráfico servido por HTTPS. |
| RNF02 | Disponibilidad | El sistema debe estar operativo durante el horario de alquiler del negocio (tardes, noches y fines de semana). | El backend corre en el plan Free de Render (ver 4.7.2), con arranque en frío tras inactividad, mitigado mediante el endpoint `/health` para monitoreo; no se exige SLA formal en esta fase. |
| RNF03 | Usabilidad | Interfaz optimizada para uso desde celular, principal dispositivo del administrador en campo. | Diseño responsive validado en al menos una resolución móvil real antes del despliegue (ver). |
| RNF04 | Instalabilidad | La app debe poder instalarse como PWA sin pasar por tienda de aplicaciones. | Manifest + service worker configurados; prompt de instalación funcional en Chrome/Android como mínimo. |
| RNF05 | Rendimiento | Tiempos de respuesta aceptables para el volumen de uso real (2 administradores, decenas de alquileres/día). | Registro de un alquiler y carga del panel del día responden en menos de 3 segundos con backend "caliente". |
| RNF06 | Escalabilidad | La arquitectura no debe requerir rediseño al evolucionar hacia la Propuesta 2. | Los subdominios definidos en 4.2 (Payments, Notifications) deben poder extenderse o activarse sin modificar el subdominio núcleo de Bookings. |
| RNF07 | Mantenibilidad | El código debe organizarse por dominio, no por tipo técnico de archivo. | Estructura de carpetas del backend refleja los bounded contexts y la separación hexagonal. |
| RNF08 | Respaldo de datos | La información no debe depender de un único punto de falla. | Backups automáticos habilitados en el proveedor de base de datos (Supabase) desde el primer despliegue en producción. |
| RNF09 | Compatibilidad | La PWA debe funcionar en los navegadores/dispositivos reales que usan Carlos y su trabajador. | Verificada en Chrome (Android) y un navegador de escritorio como mínimo. |

<br>

## 2.3. Lenguaje Ubicuo

Términos consensuados organizados por bounded context, para que el vocabulario del negocio y el vocabulario del código sean el mismo.

<br>

**Subdominio Bookings**

| Término | Significado |
|---|---|
| Cancha | Espacio deportivo alquilable del colegio (vóley, fútbol o básquet). Actualmente son 5, pero el catálogo es administrable por Carlos (RF11), no un número fijo en el sistema. |
| Franja horaria | Bloque de tiempo en el que una cancha puede alquilarse (ej. 6:00 pm – 7:00 pm). |
| Alquiler | Reserva confirmada de una cancha, para un cliente, en una fecha y franja horaria específica. |
| Doble reserva | Situación inválida en la que dos alquileres ocupan la misma cancha en la misma franja horaria. El sistema debe impedirla siempre (RF06). |
| Bloqueo por mantenimiento | Franja horaria marcada como no disponible por el administrador, sin estar asociada a un alquiler. |
| Motivo de bloqueo | Nota de texto opcional que explica la razón de un bloqueo por mantenimiento (ej. "césped en mal estado"), visible al consultar la franja bloqueada (RF32). |
| Tipo de reserva | Clasificación del alquiler según su naturaleza: pichanga (partido informal), torneo o evento. Permite distinguir el tipo de uso de la cancha más allá de quién paga (RF33). |
| Nombre de equipo/grupo | Nombre identificador del equipo o grupo que juega en un alquiler (ej. "Los Tigres"), distinto del nombre del cliente que registra y paga el alquiler (RF33). |
| Foto de cancha | Imagen adjunta a una `Court` para identificarla visualmente al momento de alquilar, especialmente útil cuando hay varias canchas del mismo tipo (RF31). |
| Disponibilidad | Estado de una cancha en una franja horaria: libre, alquilada o bloqueada. |

<br>

**Subdominio Payments**

| Término | Significado |
|---|---|
| Pago | Registro de dinero recibido por un alquiler. Puede ser total o parcial. |
| Pago parcial | Pago que cubre solo una parte del monto total del alquiler; el alquiler queda con saldo pendiente. |
| Pendiente | Estado de un alquiler cuyo monto (total o restante) aún no ha sido cobrado. |
| Método de pago | Forma en la que se recibió el dinero (efectivo, Yape, u otro registrado manualmente). |
| Comprobante de pago | Imagen adjunta a un `Payment` (captura de Yape, foto de voucher) que respalda visualmente que el cobro ocurrió (RF25). |

<br>

**Subdominio Customers**

| Término | Significado |
|---|---|
| Cliente | Persona o grupo externo (equipo, institución) que alquila una o más canchas. No tiene acceso al sistema (ver). |
| DNI / RUC | Documento de identificación del `Customer`: DNI si es persona natural, RUC si es persona jurídica (equipo formalizado, colegio, empresa). Dato adicional al nombre, útil para distinguir clientes con nombres similares y para eventuales fines contables (RF09). |
| WhatsApp de contacto | Número de WhatsApp registrado en la ficha del `Customer`, con acceso directo (enlace `wa.me`) desde su ficha o desde el detalle de un alquiler, para coordinar sin copiar el número manualmente (RF30). |
| Historial de cliente | Listado de alquileres pasados asociados a un cliente. |

<br>

**Subdominio Identity & Access**

| Término | Significado |
|---|---|
| Administrador | Usuario con acceso al sistema: Carlos o su trabajador autorizado. Rol operativo único. |
| Administrador dueño | Administrador con la capacidad adicional de autorizar o rechazar solicitudes de nuevas cuentas (RF21). Solo Carlos tiene este atributo. |
| Sesión | Periodo en el que un administrador permanece autenticado tras iniciar sesión. |
| Solicitud de acceso | Registro creado por alguien que pide una cuenta de administrador, en estado pendiente hasta que el administrador dueño la autoriza o rechaza (RF20–RF21). |

<br>

**Subdominio Notifications**

| Término | Significado |
|---|---|
| Correo de confirmación | Correo transaccional único enviado al cliente cuando se registra su `Booking`, si tiene correo registrado (RF23). No es un recordatorio recurrente. |
| Correo de resultado de solicitud | Correo enviado al solicitante de una cuenta de administrador informando si fue autorizada o rechazada (RF22). |

<br>

*Este glosario es la referencia obligatoria para nombrar clases, tablas y endpoints — evita que en el código aparezcan sinónimos distintos para el mismo concepto (ej. "reserva" vs. "alquiler").*

<br>

## 2.4. User Stories

>*Las User Stories expresan necesidades reales del negocio de Carlos, no funcionalidades de pantalla. Cada historia describe una capacidad operacional con impacto concreto en la gestión de "La Canchita de Carlos". Los criterios de aceptación siguen la estructura Gherkin (Given/When/Then) y validan **comportamiento del dominio**: estados que cambian, **invariantes que se protegen**, y eventos que se emiten — no lo que muestra la pantalla. Los aggregates raíz (`Booking`, `Court`, `Customer`, `Payment`, `User`, `AccessRequest`, `Notification`) y los Domain Events utilizados en estas historias fueron derivados del Event Storming (sección). Los criterios de aceptación se redactan en tiempo presente y tercera persona, sin referencias a detalles de interfaz.*

<br>

### Epics

| **ID** | **Título** | **Descripción** | **Historias Relacionadas** |
|---|---|---|---|
| **EP01** | **Identidad y Acceso** | Capacidad de negocio que garantiza que solo Carlos y su trabajador autorizado accedan al sistema, protegiendo la información operativa y financiera del negocio, incluyendo la recuperación de acceso si olvidan su contraseña y la configuración inicial de la cuenta dueño. | US01, US02, US03, US37, US45 |
| **EP02** | **Gestión de Reservas** | Capacidad de negocio central: administrar la disponibilidad de las canchas (calendario completo día/semana/mes) y garantizar que nunca coexistan dos alquileres para el mismo horario, permitiendo además registrar un cliente nuevo sin salir del flujo, bloquear y desbloquear franjas por mantenimiento con motivo (una o varias fechas a la vez, con su listado propio), y registrar reservas de una sola fecha, multi-día o recurrentes. | US04, US05, US06, US07, US08, US28, US31, US32, US35, US44 |
| **EP03** | **Gestión de Clientes** | Capacidad de negocio que permite mantener un registro de quién alquila, incluyendo su documento de identificación y un canal directo de contacto (WhatsApp), para dar seguimiento comercial básico. | US09, US10, US30 |
| **EP04** | **Gestión de Canchas** | Capacidad de negocio que permite mantener actualizado el inventario de canchas del colegio (catálogo administrable, no un número fijo, incluyendo su baja), sus precios y su identificación visual con fotos, base para calcular y comunicar correctamente cada alquiler. | US11, US12, US13, US29, US43 |
| **EP05** | **Gestión de Pagos** | Capacidad de negocio que permite registrar y trazar el dinero cobrado por cada alquiler, incluyendo pagos parciales, la consulta del historial de pagos de un alquiler y el respaldo visual del comprobante (adjuntarlo y volver a verlo). | US14, US15, US16, US27, US46, US47 |
| **EP06** | **Panel Operativo del Día** | Capacidad de negocio que da a Carlos visibilidad inmediata de la operación diaria: qué se alquiló, cuánto se cobró y qué falta cobrar. | US17, US18, US19 |
| **EP07** | **Registro y Autorización de Administradores** | Capacidad de negocio que permite a Carlos incorporar nuevos administradores de forma controlada, sin crear cada cuenta manualmente ni ceder acceso sin verificación, ver quién tiene acceso activo, compartir el rol de dueño con alguien de confianza y revocar el acceso cuando ya no corresponde. | US20, US21, US26, US34, US39, US40 |
| **EP08** | **Confirmación por Correo** | Capacidad de negocio que da respaldo automático por correo de las acciones clave (reserva registrada, cuenta autorizada/rechazada), sin construir un sistema de notificaciones completo. | US22, US23 |
| **EP09** | **Ajustes de Cuenta** | Capacidad de negocio que permite a cada administrador mantener actualizados sus propios datos de acceso (correo, contraseña, perfil, foto) y darse de baja del sistema, sin depender de soporte técnico externo. | US24, US25, US41, US42 |
| **EP10** | **Notificaciones Internas entre Administradores** | Capacidad de negocio que mantiene a los administradores al tanto de lo que hace el otro (reservas, series y bloqueos de mantenimiento registrados) sin que tengan que preguntarse directamente. | US38 |

<br>

*Las 47 User Stories (US01–US47) de este capítulo describen comportamiento de negocio y no referencian endpoints técnicos — su redacción no cambia con el renombrado de endpoints a inglés (ver Anexo de cambios al final del capítulo). El detalle completo de cada historia se mantiene igual al documento original; los únicos ajustes de esta revisión aplican a las Technical Stories (TS01–TS22) y al Product Backlog, donde sí se citan rutas HTTP literales.*

<br>

### Technical Stories

| **ID** | **Título** | **Descripción** | **Criterios de Aceptación** | **Epic ID** |
|---|---|---|---|---|
| **TS01** | Endpoint de registro de alquiler con validación de doble reserva | Como Developer, quiero implementar el endpoint de registro de `Booking` en Express validando la invariante de exclusividad de horario a nivel de transacción de base de datos. | **Escenario 1 – Registro exitoso (201):** <br> **Given:** POST `/bookings` con cancha y franja libres <br> **When:** el servidor procesa dentro de una transacción <br> **Then:** crea el `Booking`, emite `BookingRegistered` y retorna 201. <br><br> **Escenario 2 – Conflicto de horario (409):** <br> **Given:** la franja solicitada ya está ocupada por otro `Booking` activo <br> **When:** el servidor evalúa los `Booking` activos superpuestos dentro de la misma transacción <br> **Then:** retorna 409, no persiste el nuevo registro y responde con el `Booking` en conflicto. | EP02 |
| **TS02** | Endpoint de login y emisión de JWT | Como Developer, quiero implementar el endpoint de autenticación en Express para emitir un JWT a los administradores válidos. | **Escenario 1 – Login exitoso (200):** <br> **Given:** POST `/auth/login` con credenciales válidas de un `User` <br> **When:** el servidor valida el hash de la contraseña <br> **Then:** retorna 200 con JWT y expiración. <br><br> **Escenario 2 – Credenciales inválidas (401):** <br> **Given:** contraseña incorrecta <br> **When:** el servidor valida <br> **Then:** retorna 401 sin emitir token. | EP01 |
| **TS03** | Endpoint de registro de pagos con recálculo de saldo | Como Developer, quiero implementar el endpoint de registro de `Payment` en Express, recalculando el saldo pendiente del `Booking` asociado en una misma transacción. | **Escenario 1 – Pago parcial registrado (201):** <br> **Given:** POST `/payments` con monto menor al saldo pendiente del `Booking` <br> **When:** el servidor procesa <br> **Then:** crea el `Payment`, actualiza el estado del `Booking` a `PARCIAL`, emite `PartialPaymentRegistered` y retorna 201 con el nuevo saldo. <br><br> **Escenario 2 – Monto excede saldo pendiente (400):** <br> **Given:** el monto enviado es mayor al saldo pendiente <br> **When:** el servidor valida <br> **Then:** retorna 400 y no persiste el pago. | EP05 |
| **TS04** | Endpoint de health check | Como Developer, quiero implementar un endpoint `/health` en Express para verificar que el backend y la conexión a base de datos estén operativos, dado que Render suspende el servicio por inactividad. | **Escenario 1 – Sistema operativo (200):** <br> **Given:** el backend está corriendo y la conexión a PostgreSQL responde <br> **When:** se consulta GET `/health` <br> **Then:** retorna 200 con estado `ok`. <br><br> **Escenario 2 – Base de datos no disponible (503):** <br> **Given:** la conexión a PostgreSQL falla <br> **When:** se consulta GET `/health` <br> **Then:** retorna 503, permitiendo detectar el problema antes de que Carlos reporte que "la app no funciona". | EP02 |
| **TS05** | Endpoints de solicitud y autorización de cuentas de administrador | Como Developer, quiero implementar los endpoints de registro de solicitud y de autorización/rechazo, restringiendo la autorización al rol de administrador dueño. | **Escenario 1 – Solicitud creada (201):** <br> **Given:** POST `/users/requests` con nombre y correo no registrados <br> **When:** el servidor procesa <br> **Then:** crea `AccessRequest` en estado `PENDING`, emite `RegistrationRequestCreated` y retorna 201. <br><br> **Escenario 2 – Autorización restringida al dueño (200/403):** <br> **Given:** PATCH `/users/requests/{id}/approve` <br> **When:** el token del solicitante no corresponde a un administrador con rol dueño <br> **Then:** retorna 403 y el `AccessRequest` no cambia de estado; si el rol es correcto, retorna 200, crea el `User` en `PENDING_VERIFICATION` y emite `AdminAuthorized`. | EP07 |
| **TS06** | Listener de correo de confirmación sobre `BookingRegistered` | Como Developer, quiero implementar un listener desacoplado del endpoint de alquiler que reaccione a `BookingRegistered` y envíe el correo de confirmación vía Resend, sin bloquear la respuesta HTTP del registro del alquiler. | **Escenario 1 – Envío asíncrono exitoso:** <br> **Given:** se emite `BookingRegistered` para un `Booking` con `Customer` con correo <br> **When:** el listener procesa el evento <br> **Then:** llama a la API de Resend, y en caso de éxito emite `ConfirmationEmailSent`; el endpoint TS01 ya respondió 201 antes de que esto ocurra. <br><br> **Escenario 2 – Fallo del proveedor no afecta el alquiler (RF24):** <br> **Given:** la API de Resend retorna error <br> **When:** el listener lo captura <br> **Then:** registra el error en logs, no reintenta de forma bloqueante y el `Booking` permanece intacto. | EP08 |
| **TS07** | Endpoints de ajustes de cuenta (correo y contraseña) | Como Developer, quiero implementar los endpoints de actualización de correo y cambio de contraseña, validando la identidad del `User` autenticado. | **Escenario 1 – Cambio de correo (200/409):** <br> **Given:** PATCH `/users/me/email` con correo no usado <br> **When:** el servidor procesa <br> **Then:** retorna 200; si el correo ya existe, retorna 409 sin modificar el `User`. <br><br> **Escenario 2 – Cambio de contraseña (200/401):** <br> **Given:** PATCH `/users/me/password` con la contraseña actual y una nueva <br> **When:** el servidor valida el hash actual <br> **Then:** retorna 200 y actualiza el hash; si la contraseña actual no coincide, retorna 401 sin cambios. | EP09 |
| **TS08** | Endpoint de carga de comprobante de pago con almacenamiento en la nube | Como Developer, quiero implementar el endpoint que recibe una imagen de comprobante, la sube a un servicio de almacenamiento de archivos y guarda la referencia en el `Payment`. | **Escenario 1 – Comprobante subido (201):** <br> **Given:** POST `/payments/{id}/receipt` con una imagen válida (jpg/png, tamaño razonable) <br> **When:** el servidor sube la imagen al servicio de almacenamiento <br> **Then:** guarda la URL resultante en el `Payment` y retorna 201. <br><br> **Escenario 2 – Archivo inválido (400):** <br> **Given:** el archivo no es una imagen o excede el tamaño máximo permitido <br> **When:** el servidor valida <br> **Then:** retorna 400 y no persiste ninguna referencia en el `Payment`. | EP05 |
| **TS09** | Endpoint de alquiler con creación de cliente embebida | Como Developer, quiero extender el endpoint de registro de `Booking` (TS01) para aceptar opcionalmente los datos de un cliente nuevo y crearlo en la misma transacción antes de asociarlo. | **Escenario 1 – Alquiler y cliente creados en una sola operación (201):** <br> **Given:** POST `/bookings` incluye un bloque `newCustomer` en vez de un `customerId` existente <br> **When:** el servidor procesa dentro de una transacción <br> **Then:** crea el `Customer`, emite `CustomerRegistered`, crea el `Booking` asociado, emite `BookingRegistered` y retorna 201 con ambos identificadores. <br><br> **Escenario 2 – Conflicto de horario revierte también al cliente (rollback, 409):** <br> **Given:** la franja solicitada ya está ocupada <br> **When:** el servidor detecta el conflicto dentro de la misma transacción <br> **Then:** revierte la creación del `Customer` también (no debe quedar un cliente huérfano de un alquiler fallido) y retorna 409. | EP02 |
| **TS10** | Endpoint de carga de fotos de cancha | Como Developer, quiero implementar el endpoint que recibe una imagen de una `Court` a la vez, la sube a Supabase Storage (mismo servicio que TS08) y guarda la URL resultante en el arreglo de fotos de la cancha. | **Escenario 1 – Foto subida (201):** <br> **Given:** POST `/courts/{id}/photos` con una imagen válida <br> **When:** el servidor la sube al bucket de Storage <br> **Then:** agrega la URL al arreglo de fotos de la `Court` y retorna 201. <br><br> **Escenario 2 – Archivo inválido (400):** <br> **Given:** el archivo no es imagen o excede el tamaño máximo <br> **When:** el servidor valida <br> **Then:** retorna 400 sin modificar las fotos existentes de la `Court`. | EP04 |
| **TS11** | Endpoint de verificación de correo con token de confirmación | Como Developer, quiero implementar el endpoint que valida el token de verificación enviado por correo y activa la cuenta del `User` solo si el token es válido y no ha expirado. | **Escenario 1 – Verificación exitosa (200):** <br> **Given:** GET `/users/verify?token=...` con un token válido y vigente <br> **When:** el servidor lo valida <br> **Then:** el `User` pasa a estado `ACTIVO`, se invalida el token usado, y retorna 200. <br><br> **Escenario 2 – Token inválido o expirado (400):** <br> **Given:** el token no existe, ya fue usado o expiró <br> **When:** el servidor lo valida <br> **Then:** retorna 400 sin activar ninguna cuenta. | EP07 |
| **TS12** | Endpoint de registro de reservas en serie (multi-día/recurrente) | Como Developer, quiero implementar el endpoint que registra múltiples `Booking` vinculados por un identificador de serie dentro de una sola transacción, revirtiendo la serie completa si cualquier fecha tiene conflicto. | **Escenario 1 – Serie creada (201):** <br> **Given:** POST `/bookings/series` con un arreglo de fechas todas libres <br> **When:** el servidor procesa dentro de una transacción <br> **Then:** crea un `Booking` por fecha con el mismo identificador de serie, emite `BookingRegistered` por cada uno y retorna 201 con el arreglo completo. <br><br> **Escenario 2 – Rollback total ante conflicto (409):** <br> **Given:** una de las fechas del arreglo ya tiene un `Booking` activo o un bloqueo en esa cancha/horario <br> **When:** el servidor la detecta dentro de la misma transacción <br> **Then:** revierte todas las fechas ya creadas en esa transacción, no persiste ningún `Booking` de la serie y retorna 409 indicando la fecha en conflicto. | EP02 |
| **TS13** | Endpoint de bloqueo de mantenimiento en varias fechas | Como Developer, quiero implementar el endpoint que crea múltiples `ScheduleBlock` (uno por fecha) para una misma franja horaria, validando conflictos contra `Booking` activos antes de crear cualquiera de ellos. | **Escenario 1 – Bloqueo múltiple creado (201):** <br> **Given:** POST con cancha, horario, motivo y varias fechas sin conflicto <br> **When:** el servidor valida cada fecha <br> **Then:** crea un `ScheduleBlock` por fecha y retorna 201. <br><br> **Escenario 2 – Conflicto detiene la operación completa (409):** <br> **Given:** alguna fecha tiene un `Booking` activo en esa franja <br> **When:** el servidor la valida <br> **Then:** no crea ningún `ScheduleBlock` y retorna 409 indicando la fecha en conflicto. | EP02 |
| **TS14** | Endpoints de recuperación de contraseña olvidada | Como Developer, quiero implementar los endpoints de solicitud y confirmación de restablecimiento de contraseña, usando un token de un solo uso con expiración. | **Escenario 1 – Solicitud de restablecimiento (200 siempre):** <br> **Given:** POST `/auth/forgot-password` con un correo <br> **When:** el servidor procesa <br> **Then:** genera un token hasheado con expiración, envía el correo si el `User` existe, y retorna 200 en ambos casos (exista o no la cuenta), para no revelar si un correo está registrado. <br><br> **Escenario 2 – Restablecimiento (200/400):** <br> **Given:** POST `/auth/reset-password` con un token y nueva contraseña <br> **When:** el servidor valida el token <br> **Then:** si es válido y no expiró, actualiza la contraseña e invalida las sesiones activas, retornando 200; si es inválido o expiró, retorna 400 sin cambios. | EP01 |
| **TS15** | Endpoints de notificaciones internas entre administradores | Como Developer, quiero implementar los endpoints de listado y marcado de notificaciones internas, generadas automáticamente cuando un administrador registra un alquiler, una serie o un bloqueo de mantenimiento. | **Escenario 1 – Listado (200):** <br> **Given:** GET `/notifications` de un administrador autenticado <br> **When:** el servidor consulta <br> **Then:** retorna únicamente las notificaciones dirigidas a ese `User`. <br><br> **Escenario 2 – Marcado como leída (204):** <br> **Given:** PATCH `/notifications/{id}/read` <br> **When:** el servidor procesa <br> **Then:** la notificación queda marcada como leída y retorna 204. | EP10 |
| **TS16** | Endpoints de promoción, desactivación y perfil propio de administradores | Como Developer, quiero implementar los endpoints de promoción a dueño, desactivación de administradores (por el dueño o por sí mismos), y actualización de perfil/foto propia, restringiendo las acciones sobre otras cuentas al rol dueño. | **Escenario 1 – Promoción y desactivación restringidas al dueño (200/403):** <br> **Given:** PATCH `/users/{id}/promote-owner` o DELETE `/users/{id}` <br> **When:** quien ejecuta la acción no tiene rol dueño <br> **Then:** retorna 403 y el `User` objetivo no cambia; si el rol es correcto, aplica el cambio y retorna 200/204. <br><br> **Escenario 2 – Perfil y foto propios (200):** <br> **Given:** PATCH `/users/me/profile` o POST/DELETE `/users/{id}/photo` ejecutado por el propio dueño de la cuenta <br> **When:** el servidor procesa <br> **Then:** actualiza el perfil o la foto (reemplazando/eliminando el archivo anterior en Supabase Storage) y retorna 200. | EP09 |
| **TS17** | Endpoint de eliminación de cancha con borrado en cascada | Como Developer, quiero implementar el endpoint que elimina una `Court`, documentando explícitamente que la base de datos está configurada con `onDelete: Cascade` desde `Booking` y `Payment` hacia `Court`, por lo que este borrado es permanente y arrastra todo el historial asociado. | **Escenario 1 – Eliminación exitosa (204):** <br> **Given:** DELETE `/courts/{id}` sobre una `Court` existente <br> **When:** el servidor procesa <br> **Then:** elimina la `Court` (y en cascada sus `Booking` y `Payment` asociados por la relación de base de datos) y retorna 204. <br><br> **Escenario 2 – Cancha inexistente (404):** <br> **Given:** el `id` no corresponde a ninguna `Court` <br> **When:** el servidor la busca <br> **Then:** retorna 404 sin ejecutar ningún borrado. | EP04 |
| **TS18** | Endpoint de desbloqueo de una franja de mantenimiento | Como Developer, quiero implementar el endpoint que elimina un `ScheduleBlock` por su identificador, liberando la franja de inmediato. | **Escenario 1 – Desbloqueo exitoso (204):** <br> **Given:** DELETE `/courts/blocks/{blockId}` sobre un `ScheduleBlock` existente <br> **When:** el servidor procesa <br> **Then:** elimina el `ScheduleBlock`, emite `ScheduleUnblocked` y retorna 204. | EP02 |
| **TS19** | Endpoints de listado de bloqueos de mantenimiento (por fecha y próximos) | Como Developer, quiero implementar los endpoints que listan los `ScheduleBlock` de una cancha para una fecha específica y los próximos a partir de hoy. | **Escenario 1 – Bloqueos de una fecha (200):** <br> **Given:** GET `/courts/{id}/blocks?date=...` <br> **When:** el servidor consulta <br> **Then:** retorna los `ScheduleBlock` de esa cancha y fecha. <br><br> **Escenario 2 – Próximos bloqueos (200):** <br> **Given:** GET `/courts/{id}/blocks/upcoming` <br> **When:** el servidor consulta desde el inicio del día actual <br> **Then:** retorna solo los `ScheduleBlock` futuros, excluyendo los ya pasados. | EP02 |
| **TS20** | Endpoint de configuración inicial de la cuenta dueño | Como Developer, quiero implementar el endpoint de bootstrap que crea la primera cuenta dueño, protegido por un `SETUP_TOKEN` de servidor y bloqueado permanentemente después del primer uso. | **Escenario 1 – Bootstrap exitoso (201):** <br> **Given:** POST `/auth/bootstrap-owner` con el `SETUP_TOKEN` correcto y sin ningún dueño existente <br> **When:** el servidor valida <br> **Then:** crea el primer `User` con `isOwner: true` y retorna 201. <br><br> **Escenario 2 – Token inválido o ya configurado (403/409):** <br> **Given:** el token no coincide con `SETUP_TOKEN`, o ya existe al menos un dueño <br> **When:** el servidor valida <br> **Then:** retorna 403 (token inválido) o 409 (ya configurado), sin crear ninguna cuenta. | EP01 |
| **TS21** | Endpoint de listado de pagos de un alquiler | Como Developer, quiero implementar el endpoint que retorna todos los `Payment` asociados a un `Booking`, incluyendo los reversados. | **Escenario 1 – Listado (200):** <br> **Given:** GET `/payments/{bookingId}` <br> **When:** el servidor consulta <br> **Then:** retorna el arreglo de `Payment` de ese `Booking`, ordenado por fecha, incluyendo su estado de reversión. | EP05 |
| **TS22** | Endpoint de visualización de comprobante con URL firmada | Como Developer, quiero implementar el endpoint que genera una URL firmada temporal (300 segundos) hacia el comprobante ya almacenado en Supabase Storage, sin exponer una URL pública permanente. | **Escenario 1 – URL firmada generada (200):** <br> **Given:** GET `/payments/{bookingId}/receipt` sobre un `Payment` con comprobante adjunto <br> **When:** el servidor genera la URL firmada <br> **Then:** retorna 200 con la URL y su tiempo de expiración (300 segundos). <br><br> **Escenario 2 – Sin comprobante (404):** <br> **Given:** el `Booking` no tiene ningún `Payment` con comprobante adjunto <br> **When:** se consulta <br> **Then:** retorna 404 sin generar ninguna URL. | EP05 |

<br>

## 2.5. Product Backlog

>*El Product Backlog consolida las funcionalidades priorizadas por valor operacional para el negocio de "La Canchita de Carlos". Las historias están estimadas en Story Points (escala Fibonacci) y ordenadas por impacto operacional y dependencias funcionales: el subdominio núcleo (Bookings) precede a los subdominios de soporte (Customers, Canchas, Payments, Panel), porque ahí se concentra el riesgo de negocio más alto — la doble reserva. Las Technical Stories se listan al final para no contaminar la priorización por valor de negocio.*

<br>

**Total de Story Points: 177 | Total de historias: 67 (45 User Stories + 22 Technical Stories)**

<br>

*Nota sobre esta revisión: las descripciones de este backlog no citan rutas HTTP literales, por lo que el renombrado de endpoints a inglés no modifica ninguna fila de esta tabla — el contenido íntegro (67 filas, N° 1 a 67, US01–US47 y TS01–TS22 con su épica, título, descripción y story points) se mantiene igual al documento original.*

<br>

<div align="center">

**Herramienta de gestión utilizada:** `Jira`

</div>
<br>

---

# Capítulo III: Diseño de Producto (UX/UI)

## 3.1. Arquitectura de Información

Estructura de navegación derivada directamente de los Epics y priorizada según lo que Carlos usa con más frecuencia en el día a día (panel y calendario primero, configuración al final).

**Mapa de navegación:**

**Bienvenida (pública, sin sesión)**
 - Iniciar sesión
 - Registrar solicitud de administrador
 - Formulario: nombre, correo, complejo/negocio
 - Pantalla de espera: "Tu solicitud fue enviada, Carlos debe autorizarla"

**Panel Operativo del Día** *(pantalla de inicio tras autenticarse)*
 - Calendario de Reservas
 - Nuevo alquiler
 - Detalle / editar alquiler
 - Bloquear franja (mantenimiento)
 - Clientes
 - Ficha de cliente (historial)
 - Canchas
 - Editar cancha (precio, disciplina)
 - Pagos
 - Registrar pago (asociado a un alquiler existente)
 - Solicitudes de acceso *(visible solo para el administrador dueño)*
 - Autorizar / rechazar solicitud pendiente
 - Cerrar sesión

<br>

**Criterios de organización:**

- **Panel como home:** siguiendo US17–US19, lo primero que ve un administrador al iniciar sesión es el resumen del día, no un menú vacío, reduce clics para la tarea más frecuente.

- **Registro separado del login:** a diferencia del login, el registro de una nueva cuenta de administrador es un flujo público (sin sesión previa) pero no da acceso inmediato — queda en estado pendiente hasta que el administrador dueño la autorice desde "Solicitudes de acceso", evitando que cualquiera con el link se autoasigne acceso al negocio.

- **"Solicitudes de acceso" es visible solo para el dueño:** es la única sección de la navegación con visibilidad condicionada al tipo de cuenta — el resto de pantallas se ve igual para ambos administradores.

- **Pagos no es una sección aislada:** un pago siempre se registra desde el contexto de un alquiler específico (coherente con el subdominio Payments dependiendo de Bookings), evitando que el administrador tenga que buscar manualmente a qué alquiler corresponde un pago.

- **Clientes y Canchas son configuración de apoyo:** se accede a ellas con menor frecuencia que al calendario, por lo que quedan un nivel más profundo en la navegación en vez de competir por espacio con el calendario en la barra principal.

- **Sin nivel de "cliente final":** no existe ninguna rama de navegación para clientes externos, reforzando el alcance de la Propuesta 1, el correo de confirmación es un efecto secundario del registro de un alquiler, no una pantalla propia del cliente.

<br>

## 3.2. Style Guideliness

*(Sin cambios respecto al documento original: personalidad de marca, paleta azul/celeste/blanco + paleta funcional verde/ámbar/rojo, tono de contenido, logo/isotipo, tokens de color y tipografía Lobster Two/Outfit, componentes base Tailwind. Ninguno de estos elementos referencia endpoints ni se ve afectado por el renombrado.)*

<br>

## 3.3. Wireframes y Mockups

*(Sin cambios: wireframes y mockups Desktop/Mobile para las 11 pantallas — login, register, home, calendario, registrar-alquiler, clientes, reservas, canchas, registrar-cancha, ajustes, solicitudes — y el User Flow Diagram. Las imágenes y sus rutas (`assets/wireframes/...`, `assets/mockups/...`) no cambian.)*

<br>

## 3.4. Prototipo en Figma

*(Sin cambios: prototipo interactivo Desktop y Mobile en Figma, con los videos y el link navegable ya documentados.)*

<br>

---

# Capítulo IV: Arquitectura de Software (Domain-Driven Design)

## 4.0. Patrón de Arquitectura

*(Sin cambios: arquitectura de tres capas — Presentación/Aplicación/Datos — combinada con arquitectura hexagonal dentro de la capa de Aplicación, organizada por los 6 bounded contexts `bookings`, `customers`, `identity`, `notifications`, `panel`, `payments`, más la capa transversal `platform/`.)*

<br>

## 4.1. Design-Level Event Storming

*(Sin cambios: los 10 pasos del Event Storming — Unstructured Exploration, Timelines, Hotspots, Pivotal Events, Commands & Actors, Policies, Read Models, External Systems, Aggregates, Bounded Contexts — y la Tabla 4.1.1 de Comands/Aggregates/Events se mantienen igual, ya que documentan comandos y eventos de dominio, no rutas HTTP.)*

<br>

## 4.2. Bounded Contexts y Context Map

*(Sin cambios: la tabla de los 6 subdominios — Bookings, Payments, Customers, Identity & Access, Panel, Notifications — con su tipo, alcance y justificación, y las relaciones del Context Map, se mantienen igual.)*

<br>

## 4.3. Software Architecture Context Diagram

*(Sin cambios: describe los actores humanos —Administrador, Administrador Dueño, Solicitante, Cliente del negocio— y los tres sistemas externos —Resend, Supabase Storage, WhatsApp— con los que se integra el sistema. No cita rutas HTTP.)*

<br>

## 4.4. Software Architecture Container Diagram

*(Sin cambios: describe los tres contenedores desplegables —Frontend PWA, Backend API, Base de Datos— y cómo se comunican entre sí. No cita rutas HTTP.)*

<br>

## 4.5. Software Architecture Components Diagrams

*(Sin cambios: describe los componentes internos de los 6 bounded contexts —Bookings, Customers, Payments, Identity & Access, Panel, Notifications— siguiendo los 3 anillos de la arquitectura hexagonal. Documenta casos de uso y repositorios, no rutas HTTP literales.)*

<br>

## 4.6. Cloud Architecture (PWA)

**Stack definido para este proyecto:**

<br>

| Capa | Tecnología | Motivo |
|---|---|---|
| Frontend | React + Vite + TypeScript + `vite-plugin-pwa` + Tailwind CSS | Build rápido en desarrollo (HMR de Vite) y soporte PWA (manifest + service worker) de fábrica, sin configurar herramientas adicionales. TypeScript comparte tipos con el backend (vía Prisma) para detectar errores antes de producción. |
| Estado / datos | React Query (o similar) + React Router | Manejo simple de llamadas a la API y cacheo, sin over-engineering. |
| Backend | Node.js + Express + TypeScript | Framework minimalista sin convenciones forzadas, adecuado para una API con alcance acotado (Capítulo II); reduce la curva de aprendizaje frente a frameworks más opinados como NestJS y evita el vendor lock-in de una plataforma BaaS como Firebase. |
| ORM | Prisma | Migraciones automáticas y modelos tipados, acelera el diseño de BD del Capítulo VI. |
| Base de datos | PostgreSQL gestionado (Supabase, plan gratuito) | Relacional, soporta transacciones/constraints para evitar doble reserva (clave para RF06). |
| Autenticación | JWT + bcrypt implementado en Express | Solo 2 usuarios administradores; no se justifica un proveedor de auth externo todavía. |
| Hosting Frontend | Render (Static Site, plan gratuito) | Build de Vite servido con CDN y HTTPS incluidos, en el mismo proveedor y dashboard que el backend — evita administrar una cuenta/proveedor adicional (Vercel/Netlify) con el plazo de 2 semanas y 1 sola desarrolladora. |
| Hosting Backend | Render (Web Service, plan Free) | Despliegue simple de un servicio Node/Express, variables de entorno fáciles de configurar. Se mantiene en el plan gratuito para conservar el costo recurrente en US$0 (ver 4.7.2); la contrapartida es el "cold start" tras inactividad, mitigado mediante el endpoint `/health` (TS04), no eliminado. |
| Repositorio | GitHub | Integración directa con Render para despliegue continuo de ambos servicios (Static Site + Web Service). |
| Envío de correo | Resend (plan gratuito) | API simple desde Node/Express, plan gratuito con volumen muy por encima de lo que este negocio necesita (RF23–RF24); evita configurar SMTP manualmente. |
| Almacenamiento de archivos | Supabase Storage (plan gratuito) | Guarda las imágenes de comprobante de pago (RF25) fuera de la base de datos relacional (evita guardar binarios pesados en Postgres); plan gratuito suficiente para el volumen de este negocio. |

<br>

*(Nota de esta revisión: la fila "Hosting Backend" se corrigió de "plan Starter, de pago" a "plan Free", para que sea consistente con la decisión real documentada en 4.7.2, 4.7.5, 8.4 y 10.1 — todas indican que el backend corre en el plan gratuito de Render con arranque en frío aceptado como trade-off, mitigado por `/health`.)*

<br>

**Diagrama de arquitectura de capas**

*(Sin cambios: la matriz Presentación/Aplicación/Datos × Software/Sistema Operativo/Hardware se mantiene igual.)*

<br>

## 4.7. Análisis Técnico-Económico de la Infraestructura

*(Sin cambios respecto al documento original en 4.7.1, 4.7.2 — incluida la sección "Hardware (Web Service)" que ya documentaba correctamente la elección del plan **Free** de Render con la tabla comparativa de planes (Free/Starter/Standard/Pro) — 4.7.3, 4.7.4, 4.7.5 y 4.7.6 (Seguridad). Ninguna de estas secciones citaba endpoints en español que requieran actualización.)*

<br>

## 4.8. Diagrama de Secuencia

El siguiente diagrama de secuencia detalla la interacción entre los componentes del sistema (Frontend PWA, Backend API, Base de Datos y Resend) para el flujo crítico de negocio: **registrar un alquiler validando la invariante de no doble reserva (RF06)** y disparando el correo de confirmación de forma asíncrona (RF23-RF24).

<br>

![Sequence Diagram](assets/sequence-diagram/sequence.png)

<br>

El flujo mostrado es: el Administrador completa el formulario de Nueva Reserva → el Frontend envía `POST /bookings` al Backend → el Backend abre una transacción en PostgreSQL para validar que no exista un `Booking` activo en la misma cancha/franja → si hay conflicto, retorna `409` (`DoubleBookingRejected`); si no, persiste el `Booking`, retorna `201` (`BookingRegistered`) y dispara de forma asíncrona el envío del correo de confirmación vía Resend, sin bloquear la respuesta HTTP ya entregada al administrador.

<br>

---

# Capítulo V: Software Object-Oriented Design

## 5.1. Class Diagrams — Backend

El backend está organizado como un monolito modular con **arquitectura hexagonal (ports & adapters)**, dividido en 6 bounded contexts independientes. Cada uno sigue la misma estructura de 4 capas: `domain/model` (entidades y puertos, sin dependencias de framework), `application` (casos de uso), `infrastructure/persistence/repositories` (adaptadores Prisma) e `interfaces/rest` (routers Express + DTOs). Todos los contextos comparten dos piezas de infraestructura transversal: la conexión a **Supabase Postgres** vía Prisma, y **Supabase Storage** para archivos (fotos, comprobantes).

La conexión a la base de datos usa dos URLs distintas de Supabase: `DATABASE_URL` (conexión con *connection pooling*/PgBouncer) y `DIRECT_URL` (conexión directa, usada solo por Prisma CLI para migraciones). Los archivos no se guardan en la base de datos: se suben a un bucket de **Supabase Storage** (`la-canchita-de-carlos`), organizados en 3 carpetas `perfiles/`, `canchas/` y `comprobantes/`, y la base de datos solo guarda la *ruta* del archivo.

<br>

### 5.1.1. Bounded context: Bookings (Reservas, Canchas y Mantenimiento)

![Class Backend Diagrams](assets/class-diagrams/backend/bookings-context.png)

Este es el contexto más grande del sistema: agrupa las entidades `Booking`, `Court` y `ScheduleBlock`, con sus reglas de dominio (`overlaps`, `hasConflict`, `assertWithinOperatingHours`, `assertNotInPast`, `assertCourtAvailableForBooking`). Expone **17 endpoints** bajo `/bookings` (5) y `/courts` (12): registrar/editar/cancelar/buscar reservas (incluyendo reservas en serie multidía/recurrente vía `POST /bookings/series`), y el CRUD completo de canchas más el manejo de bloqueos de horario por mantenimiento (`/courts/:id/blocks*`).

**Conexión con Supabase:** 

`PrismaBookingRepository`, `PrismaCourtRepository` y `PrismaScheduleBlockRepository` leen/escriben sobre las tablas `bookings`, `courts` y `schedule_blocks`. Además, `addCourtPhoto.usecase.ts` usa `SupabaseFileStorage` para subir la foto de la cancha a la carpeta `canchas/` del bucket.

**Conexión con Resend:** 

Al registrar una reserva (individual o en serie), este contexto dispara dos correos — `sendBookingConfirmation` al cliente y `sendNewBookingAlert` a todos los demás administradores activos. También genera notificaciones internas (campanita) de tipo `NEW_BOOKING` en cada registro, y `COURT_MAINTENANCE` cuando se programa un bloqueo **en serie**.

<br>

### 5.1.2. Bounded context: Customers (Clientes)

![Class Backend Diagrams](assets/class-diagrams/backend/customers-context.png)

Contexto simple, con una única entidad `Customer` (nombre, teléfono, DNI/RUC opcional, estado). Expone **5 endpoints** bajo `/customers`: listar/buscar, crear, editar, desactivar (borrado lógico) y consultar el historial de reservas de un cliente (`GET /customers/:id/history`).

**Conexión con Supabase:** 

`PrismaCustomerRepository` opera sobre la tabla `customers`. Este contexto no sube archivos a Storage ni dispara correos directamente.

<br>

### 5.1.3. Bounded context: Identity (Usuarios, Sesiones y Acceso)

![Class Backend Diagrams](assets/class-diagrams/backend/identity-context.png)

Agrupa `User`, `Session`, `PasswordResetToken`, `EmailVerificationToken` y `AccessRequest`. Expone **20 endpoints**: 5 bajo `/auth` (login, logout, bootstrap del primer owner vía `/auth/bootstrap-owner`, y el flujo completo de recuperación de contraseña vía `/auth/forgot-password` y `/auth/reset-password`) y 15 bajo `/users` (solicitudes de acceso vía `/users/requests*`, verificación de correo vía `/users/verify`, gestión de perfil propio vía `/users/me/email`, `/users/me/password`, `/users/me/profile`, gestión de administradores vía `/users/:id/promote-owner`, subida/borrado de foto de perfil vía `/users/:id/photo`).

**Conexión con Supabase:** 

5 repositorios Prisma sobre sus tablas respectivas. `uploadUserPhoto.usecase.ts`/`removeUserPhoto.usecase.ts` usan `SupabaseFileStorage` con la carpeta `perfiles/`.

**Conexión con Resend:**  

Es el contexto que más tipos de correo dispara — `sendNewAccessRequestAlert`, `sendAdminDecision`, `sendEmailVerification` y `sendPasswordReset`.

<br>

### 5.1.4. Bounded context: Notifications (Notificaciones y Correos)

![Class Backend Diagrams](assets/class-diagrams/backend/notifications-context.png)

Este contexto tiene doble función: la entidad `Notification` y sus **2 endpoints** bajo `/notifications` (`GET /` para listar las propias, `PATCH /:id/read` para marcarlas leídas) alimentan la campanita del panel. Por otro lado, este mismo contexto es dueño del **adaptador de Resend** (`ResendNotificationSender`), usado por los otros contextos para enviar sus 6 tipos de correo.

**Conexión con Supabase:** 

`PrismaNotificationRepository` sobre la tabla `notifications`.

<br>

### 5.1.5. Bounded context: Panel (Métricas del Dashboard)

![Class Backend Diagrams](assets/class-diagrams/backend/panel-context.png)

Contexto de solo lectura, sin entidad propia: agrega datos de `bookings` y `payments` para alimentar el resumen del día. Expone **3 endpoints** bajo `/panel`: `GET /panel/todays-bookings`, `GET /panel/todays-revenue` y `GET /panel/todays-pending-payments`.

**Conexión con Supabase:** 

`PrismaPanelRepository` ejecuta consultas de agregación directamente sobre las tablas `bookings` y `payments`.

<br>

### 5.1.6. Bounded context: Payments (Pagos)

![Class Backend Diagrams](assets/class-diagrams/backend/payments-context.png)

Contiene la entidad `Payment` (historial de pagos parciales/totales por reserva, incluyendo su estado de reversión vía `reversedAt`). Expone **4 endpoints** bajo `/payments`: registrar un pago, listar los pagos de una reserva, subir el comprobante (`POST /payments/:bookingId/receipt`) y generar una URL firmada temporal para verlo (`GET /payments/:bookingId/receipt`).

**Conexión con Supabase:** 

`PrismaPaymentRepository` sobre la tabla `payments`, con una operación atómica (`registerPaymentAtomic`) que inserta el pago y actualiza `boo_paid_amount`/`boo_payment_status` en `bookings` en la misma transacción. `attachReceipt.usecase.ts` usa `SupabaseFileStorage` con la carpeta `comprobantes/`.

<br>

## 5.2. Class Diagrams — Frontend

El frontend está organizado por **módulo de negocio**, cada uno con su carpeta `hooks/` (llamadas a la API vía TanStack Query, usando `apiClient` de Axios con el token JWT inyectado por interceptor) y `components/` (las pantallas). En total son 18 pantallas repartidas en 20 rutas.

<br>

### 5.2.1. Mapa General de Módulos

![Class Frontend Diagrams](assets/class-diagrams/frontend/overview.png)

*(Sin cambios: la relación entre los 7 módulos —`bookings`, `customers`, `dashboard`, `settings`, `courts`, `auth`, `shared`— es la misma; el renombrado de endpoints no altera qué módulo depende de cuál.)*

<br>

### 5.2.2. Módulo `auth` — Sesión y Acceso

![Class Frontend Diagrams](assets/class-diagrams/frontend/auth.png)

- **`LoginPage`** (`/login`): formulario de inicio de sesión con usuario/correo y contraseña; llama a `POST /auth/login` y guarda el token vía `useAuth`.
- **`RequestAccessPage`** (`/solicitar-acceso`): formulario para pedir una cuenta de administrador nueva; llama a `POST /users/requests`.
- **`SolicitudEnviadaPage`** (`/solicitud-enviada`): pantalla de confirmación tras enviar la solicitud, sin llamadas a la API.
- **`ForgotPasswordPage`** (`/olvide-password`): pide el correo para iniciar la recuperación; llama a `POST /auth/forgot-password`.
- **`ResetPasswordPage`** (`/restablecer-password`): toma el token de la URL y define la nueva contraseña; llama a `POST /auth/reset-password`.
- **`VerificarCorreoPage`** (`/verificar-correo`): confirma el correo de un administrador recién aprobado; llama a `GET /users/verify`.

*(Nota: las rutas de React Router entre paréntesis, como `/olvide-password`, son rutas de navegación del frontend y no cambiaron — solo las llamadas backend (`POST`/`GET ...`) fueron renombradas a inglés.)*

Todas comparten el layout `AuthLayout` y se apoyan en `AuthProvider`/`useAuth` (contexto de React que guarda el usuario y el token, y expone `login`/`logout`/`updateUser`).

<br>

### 5.2.3. Módulo `dashboard` — Panel Principal

![Class Frontend Diagrams](assets/class-diagrams/frontend/dashboard.png)

- **`PanelPage`** (`/panel`): pantalla de inicio tras loguearse. Combina 3 fuentes de datos (`useTodayBookings` contra `/panel/todays-bookings`, `useCourts`, `useScheduleBlocks`) para mostrar el resumen del día, el próximo horario libre calculado en el cliente, el gráfico de ocupación semanal, avisos de mantenimiento del día y el botón flotante (FAB) de acceso directo a "Nueva reserva".

<br>

### 5.2.4. Módulo `bookings` — Calendario, Reservas y Mantenimiento

![Class Frontend Diagrams](assets/class-diagrams/frontend/bookings.png)

- **`CalendarioPage`** (`/calendario`): calendario de disponibilidad por cancha en 3 vistas (día/semana/mes), construido a partir de `useCourts`, `useBookings`, `useScheduleBlocks`/`useScheduleBlocksRange`.
- **`NuevaReservaPage`** (`/calendario/nueva-reserva` y `/calendario/nueva-reserva/:id/editar`): formulario para registrar o editar una reserva (individual, multidía o recurrente vía `POST /bookings` o `POST /bookings/series`), elegir cliente, método de pago y adjuntar comprobante.
- **`ReservasPage`** (`/reservas`): listado/búsqueda de todas las reservas con filtros, gestión de pagos pendientes y cancelaciones (`POST /bookings/:id/cancel`).
- **`ProgramarMantenimientoModal`** (modal, sin ruta propia): formulario para bloquear una o varias franjas horarias por mantenimiento.
- **`MantenimientosProgramadosModal`** (modal, sin ruta propia): lista los próximos mantenimientos programados de una cancha y permite cancelarlos.

<br>

### 5.2.5. Módulo `courts` — Canchas

Este módulo no tiene diagrama de clases propio (sus componentes `CanchasPage` y `NuevaCanchaPage` consumen directamente los hooks de `bookings`):

- **`CanchasPage`** (`/canchas`): catálogo de canchas — ver, activar/desactivar, eliminar, y acceso a mantenimientos programados.
- **`NuevaCanchaPage`** (`/canchas/nueva` y `/canchas/:id/editar`): formulario para registrar o editar una cancha (nombre, deporte, tarifa, horario de atención, foto — llama a `PATCH /courts/:id/price` y `POST /courts/:id/photos`).

<br>

### 5.2.6. Módulo `customers` — Clientes

![Class Frontend Diagrams](assets/class-diagrams/frontend/customers.png)

- **`ClientesPage`** (`/clientes`): ficha de clientes registrados — buscar, crear, editar, ver historial de reservas, contactar por WhatsApp y eliminar. Usa `useCustomers` contra `GET /customers`.

<br>

### 5.2.7. Módulo `settings` — Ajustes y Administración

![Class Frontend Diagrams](assets/class-diagrams/frontend/settings.png)

- **`AjustesPage`** (`/ajustes`): perfil propio (foto, nombre, usuario, correo, contraseña vía `PATCH /users/me/email`, `PATCH /users/me/password`, `PATCH /users/me/profile`, `POST`/`DELETE /users/:id/photo`), vista previa de solicitudes de acceso pendientes y de usuarios activos, y eliminar cuenta propia.
- **`SolicitudesAccesoPage`** (`/ajustes/solicitudes`): gestión completa de solicitudes de acceso (aprobar/rechazar vía `PATCH /users/requests/:id/approve` y `/reject`) y de administradores con acceso (quitar acceso/eliminar) — protegida para que solo el owner pueda entrar.

<br>

### 5.2.8. Módulo `shared` — Componentes Base

![Class Frontend Diagrams](assets/class-diagrams/frontend/shared.png)

- **`AppShell`**: layout compartido por todas las pantallas protegidas — barra de navegación, buscador, campanita de notificaciones (`useNotifications`/`useMarkNotificationRead` contra `GET /notifications` y `PATCH /notifications/:id/read`), botón de ayuda/WhatsApp, avatar y menú inferior en móvil.
- **`ProtectedRoute`**: envuelve las rutas que requieren sesión activa; redirige a `/login` si no hay usuario autenticado.
- **`NotFoundPage`** (`*`, cualquier ruta no reconocida): página 404 con enlace de regreso al Panel o al Login según si hay sesión activa.
- **`apiClient`/`queryClient`**: instancia de Axios con interceptor de `Authorization: Bearer <token>`, y el `QueryClient` de TanStack Query.

<br>

---

# Capítulo VI: Database Design

## 6.1. Modelo Entidad-Relación

<br>

## 6.2. Diagrama de Base de Datos

<br>

## 6.3. Diccionario de Datos

*(Sin cambios respecto al documento original: 6.1 Modelo Entidad-Relación con las 11 entidades y su nomenclatura en inglés/snake_case con prefijos de 3 letras, 6.2 Database Diagrams, y 6.3 Diccionario de Datos con el detalle campo por campo de `users`, `sessions`, `password_reset_tokens`, `email_verification_tokens`, `access_requests`, `courts`, `schedule_blocks`, `customers`, `bookings`, `payments` y `notifications`. Ninguna de estas tablas o columnas cambia de nombre con el renombrado de endpoints — los nombres de columnas de base de datos ya estaban en inglés desde el diseño original y son independientes de las rutas HTTP.)*

<br>

---

# Capítulo VII: Gestión del Proyecto

## 7.1. Plan de Sprints

<br>

## 7.2. Sprint 1

*(Sin cambios respecto al documento original en 7.1 Plan de Sprints, 7.2 Sprint 1 completo (Sprint Planning, Sprint Backlog, Development/Execution/Services Evidence) y 7.4 Definition of Done — estas secciones documentan el trabajo contra el fake API `json-server` del Sprint 1, no la API real, por lo que no había endpoints en español que corregir.)*

## 7.3. Sprint 2

*(7.3.1 Sprint Planning 2, 7.3.2 Sprint Backlog 2 y 7.3.3 Development Evidence se mantienen igual — las columnas de Work-Items del Sprint Backlog citan rutas antiguas en varias filas; a continuación el detalle de las que cambian, para actualizar directamente en tu tabla del 7.3.2:)*

| Work-Item | Texto original | Texto corregido |
|---|---|---|
| T-13 | `POST /users/solicitudes` + pantalla conectada | `POST /users/requests` + pantalla conectada |
| T-14 | `PATCH /users/solicitudes/{id}/autorizar` y `/rechazar` | `PATCH /users/requests/{id}/approve` y `/reject` |
| T-20 | `PATCH /users/me/correo` | `PATCH /users/me/email` |
| T-21 | `PATCH /users/me/contrasena` | `PATCH /users/me/password` |
| T-27 | `GET /users/verificar` (TS11) + envío del enlace tras autorización | `GET /users/verify` (TS11) + envío del enlace tras autorización |
| T-08 | `POST /payments/{id}/comprobante` | `POST /payments/{id}/receipt` |
| T-10 | `GET /panel/alquileres-del-dia` + `PanelPage` | `GET /panel/todays-bookings` + `PanelPage` |
| T-11 | `GET /panel/ingreso-del-dia` + tarjeta de ingreso | `GET /panel/todays-revenue` + tarjeta de ingreso |
| T-12 | `GET /panel/pendientes-del-dia` + lista de pendientes | `GET /panel/todays-pending-payments` + lista de pendientes |
| T-37 | `PATCH /courts/{id}/precio` | `PATCH /courts/{id}/price` |
| T-42 | `GET /customers/{id}/historial` | `GET /customers/{id}/history` |
| T-43 | `POST /bookings/serie` + selector Única/Multidía/Recurrente | `POST /bookings/series` + selector Única/Multidía/Recurrente |
| T-45 | `POST /courts/{id}/bloqueos/serie` | `POST /courts/{id}/blocks/series` |
| T-47 | `GET /courts/{id}/bloqueos` y `/bloqueos/proximos` | `GET /courts/{id}/blocks` y `/blocks/upcoming` |
| T-49 | `DELETE /courts/bloqueos/{blockId}` | `DELETE /courts/blocks/{blockId}` |
| T-52 | `POST /auth/olvide-password` + `/restablecer-password` + `ResetPasswordPage` | `POST /auth/forgot-password` + `/reset-password` + `ResetPasswordPage` |
| T-54 | `PATCH /users/{id}/promover-dueno` | `PATCH /users/{id}/promote-owner` |
| T-56 | `PATCH /users/me/perfil` + `POST`/`DELETE /users/{id}/foto` | `PATCH /users/me/profile` + `POST`/`DELETE /users/{id}/photo` |
| T-63 | `GET /payments/{bookingId}/comprobante` | `GET /payments/{bookingId}/receipt` |
| T-65 | `POST /auth/bootstrap-dueno` | `POST /auth/bootstrap-owner` |

*(El resto de los Work-Items — T-01 a T-69 no listados arriba — ya usan rutas que no cambiaron o no citan un path literal, y se mantienen igual.)*

<br>

### 7.3.4. Execution Evidence for Sprint Review

*(Sin cambios: las 15 capturas de ejecución en producción — login, register, restablecer, panel, calendario, reservas, reserva, clientes, cliente, canchas, cancha, info, ajustes, correo1, correo2 — con sus leyendas, se mantienen igual. Son capturas de pantalla de la UI, no dependen del nombre interno de la ruta backend.)*

<br>

### 7.3.5. Services Documentation Evidence for Sprint Review

Durante el Sprint 2 se implementaron los endpoints reales de la API (Express + Prisma), reemplazando por completo el fake API del Sprint 1. La API quedó organizada en ocho routers por bounded context: `bookings`, `courts`, `customers`, `auth`, `users`, `notifications`, `panel` y `payments`, todos protegidos por `requireAuth` (y `requireOwner` en las rutas exclusivas del administrador dueño).

Las pruebas se ejecutaron con Postman contra la API real desplegada en Render (`https://api.moli-voleibol.com`), y las capturas de cada request/response se adjuntan como evidencia de funcionamiento.

<br>

#### 7.3.5.1. Configuración previa en Postman

1. Crear un Environment con las variables `baseUrl` = `https://api.moli-voleibol.com`, `token` (vacío, se completa tras el login), `courtId` / `customerId` / `bookingId` / `blockId` / `solicitudId` / `notificationId` / `targetUserId` (se completan según las respuestas).
2. En cada request protegida, configurar el header `Authorization: Bearer {{token}}`.
3. Ejecutar primero el bloque **Auth** para obtener el token antes de probar el resto de los módulos.

<br>

#### 7.3.5.2. Plan de pruebas por módulo

<br>

**Auth (`/auth`)**

| # | Método | Endpoint | Descripción de la prueba | Body de ejemplo | Resultado esperado |
|---|---|---|---|---|---|
| 1 | POST | `/auth/bootstrap-owner` | Crear el primer usuario dueño (solo funciona una vez, protegido por `SETUP_TOKEN`). | `{ "name": "Carlos", "email": "carlos@example.com", "password": "********", "setupToken": "..." }` | `201` con el usuario creado. Repetir la prueba debe devolver `409` (ya existe un dueño). |
| 2 | POST | `/auth/login` | Iniciar sesión con credenciales válidas. | `{ "usernameOrEmail": "carlos@example.com", "password": "********" }` | `200` con `token` (JWT) y datos del usuario. Guardar el token en la variable `{{token}}`. |
| 3 | POST | `/auth/login` | Iniciar sesión con contraseña incorrecta. | `{ "usernameOrEmail": "carlos@example.com", "password": "incorrecta" }` | `401 Credenciales inválidas`. |
| 4 | POST | `/auth/forgot-password` | Solicitar restablecimiento de contraseña. | `{ "email": "carlos@example.com" }` | `200` (respuesta genérica, no revela si el correo existe). Verificar en Resend que se envió el correo "Restablece tu contraseña". |
| 5 | POST | `/auth/reset-password` | Restablecer la contraseña con el token recibido por correo. | `{ "token": "<token del correo>", "newPassword": "NuevaClave123" }` | `200`, y cierre de todas las sesiones activas del usuario. |
| 6 | POST | `/auth/logout` | Cerrar sesión con el token vigente. | — (header `Authorization: Bearer {{token}}`) | `200`, y una llamada posterior a cualquier endpoint protegido con ese mismo token responde `401`. |

<br>

**Users (`/users`)**

| # | Método | Endpoint | Descripción de la prueba | Body de ejemplo | Resultado esperado |
|---|---|---|---|---|---|
| 7 | POST | `/users/requests` | Registrar una solicitud de acceso de nuevo administrador. | `{ "name": "Ana Torres", "email": "ana@example.com", "password": "********" }` | `201`. Verificar en Resend el correo "Nueva solicitud de acceso" enviado a los administradores existentes. |
| 8 | GET | `/users/verify?token=...` | Verificar el correo con el token enviado tras la autorización. | — | `200`, cuenta marcada como verificada. |
| 9 | GET | `/users/requests` | Listar solicitudes pendientes (requiere rol dueño). | — | `200` con el arreglo de solicitudes. Repetir con un token que no sea de dueño debe devolver `403`. |
| 10 | PATCH | `/users/requests/:id/approve` | Autorizar una solicitud. | — | `200`. Verificar en Resend el correo "Tu solicitud de acceso fue autorizada" + el correo de verificación. |
| 11 | PATCH | `/users/requests/:id/reject` | Rechazar una solicitud. | — | `200`. Verificar en Resend el correo "Tu solicitud de acceso fue rechazada". |
| 12 | PATCH | `/users/:id/promote-owner` | Promover a un administrador a dueño (requiere rol dueño). | — | `200` con el usuario actualizado. |
| 13 | GET | `/users` | Listar administradores activos. | — | `200` con el arreglo de usuarios. |
| 14 | GET | `/users/me` | Obtener el perfil del usuario autenticado. | — | `200` con los datos propios (incluye URL firmada de foto si tiene). |
| 15 | PATCH | `/users/me/email` | Actualizar el correo propio. | `{ "email": "nuevo@example.com" }` | `200` con el correo actualizado. |
| 16 | PATCH | `/users/me/password` | Cambiar la contraseña propia. | `{ "currentPassword": "...", "newPassword": "..." }` | `200`. Repetir con `currentPassword` incorrecta debe devolver `401`. |
| 17 | PATCH | `/users/me/profile` | Actualizar nombre u otros datos del perfil. | `{ "name": "Carlos Ríos" }` | `200` con el perfil actualizado. |
| 18 | POST | `/users/:id/photo` | Subir foto de perfil (form-data, campo `photo`). | form-data: `photo` = archivo `.jpg` | `200` con la URL firmada de la foto. |
| 19 | DELETE | `/users/:id/photo` | Eliminar la foto de perfil. | — | `200`, foto eliminada de Supabase Storage. |
| 20 | DELETE | `/users/me` | Eliminar la cuenta propia. | — | `200`/`204`. |
| 21 | DELETE | `/users/:id` | Eliminar a otro administrador (requiere rol dueño). | — | `200`/`204`. Repetir sin rol dueño debe devolver `403`. |

<br>

**Courts (`/courts`)**

| # | Método | Endpoint | Descripción de la prueba | Body de ejemplo | Resultado esperado |
|---|---|---|---|---|---|
| 22 | POST | `/courts` | Registrar una nueva cancha. | `{ "name": "Cancha 1", "sport": "Vóley", "openTime": "08:00", "closeTime": "22:00", "pricePerHour": 40 }` | `201` con la cancha creada. Guardar `id` en `{{courtId}}`. |
| 23 | GET | `/courts` | Listar todas las canchas. | — | `200` con el arreglo de canchas. |
| 24 | PATCH | `/courts/:id` | Editar nombre/disciplina de una cancha. | `{ "name": "Cancha Vóley 1" }` | `200` con la cancha actualizada. |
| 25 | PATCH | `/courts/:id/price` | Actualizar el precio por hora. | `{ "pricePerHour": 45 }` | `200`. Repetir con un monto negativo debe devolver `400`. |
| 26 | GET | `/courts/availability?date=YYYY-MM-DD` | Consultar disponibilidad consolidada de todas las canchas para una fecha. | — | `200` con el estado de cada cancha (libre/ocupada/bloqueada por franja). |
| 27 | POST | `/courts/:id/blocks` | Bloquear una franja por mantenimiento. | `{ "date": "2026-08-01", "startTime": "09:00", "endTime": "10:00", "reason": "Mantenimiento de piso" }` | `201`. Repetir sobre una franja con alquiler activo debe devolver `409`. |
| 28 | POST | `/courts/:id/blocks/series` | Bloquear la misma franja en varias fechas. | `{ "dates": ["2026-08-01","2026-08-08"], "startTime": "09:00", "endTime": "10:00" }` | `201` con los bloqueos creados. |
| 29 | GET | `/courts/:id/blocks/upcoming` | Listar los próximos bloqueos de una cancha. | — | `200` con el arreglo de bloqueos futuros. |
| 30 | GET | `/courts/:id/blocks?date=YYYY-MM-DD` | Listar los bloqueos de una cancha para una fecha. | — | `200` con el arreglo completo de bloqueos de esa fecha. |
| 31 | DELETE | `/courts/blocks/:blockId` | Eliminar (desbloquear) un bloqueo. | — | `200`/`204`, franja liberada. |
| 32 | POST | `/courts/:id/photos` | Subir foto de la cancha (form-data, campo `photo`). | form-data: `photo` = archivo `.jpg` | `200` con la URL firmada de la foto. |
| 33 | DELETE | `/courts/:id` | Eliminar una cancha. | — | `200`/`204`. **Nota:** por la relación `onDelete: Cascade` del schema, esto elimina también sus alquileres y pagos asociados — usar con una cancha de prueba sin historial. |

<br>

**Customers (`/customers`)**

| # | Método | Endpoint | Descripción de la prueba | Body de ejemplo | Resultado esperado |
|---|---|---|---|---|---|
| 34 | POST | `/customers` | Registrar un cliente nuevo. | `{ "name": "Juan Pérez", "phone": "987654321", "documentNumber": "12345678" }` | `201` con el cliente creado. Guardar `id` en `{{customerId}}`. |
| 35 | GET | `/customers` | Listar clientes. | — | `200` con el arreglo de clientes. |
| 36 | PATCH | `/customers/:id` | Editar datos de un cliente. | `{ "phone": "987000000" }` | `200` con el cliente actualizado. |
| 37 | GET | `/customers/:id/history` | Consultar el historial de alquileres de un cliente. | — | `200` con el arreglo de alquileres asociados. |
| 38 | DELETE | `/customers/:id` | Eliminar un cliente. | — | `200`/`204`. Verificar que el historial de alquileres no se borra (el cliente queda desasociado, no se aplica cascade). |

<br>

**Bookings (`/bookings`)**

| # | Método | Endpoint | Descripción de la prueba | Body de ejemplo | Resultado esperado |
|---|---|---|---|---|---|
| 39 | POST | `/bookings` | Registrar un alquiler. | `{ "courtId": {{courtId}}, "customerId": {{customerId}}, "customerName": "Juan Pérez", "customerEmail": "juan@example.com", "date": "2026-08-01", "startTime": "18:00", "endTime": "19:00", "totalAmount": 40 }` | `201` con el alquiler creado. Verificar en Resend el correo "Confirmación de tu alquiler". Guardar `id` en `{{bookingId}}`. |
| 40 | POST | `/bookings` | Repetir el mismo request (misma cancha/fecha/horario). | (igual al anterior) | `409 Ya existe un alquiler activo en esa franja` — evidencia de la validación anti-doble-reserva. |
| 41 | POST | `/bookings/series` | Registrar una serie de reservas (multi-día). | `{ "courtId": {{courtId}}, "customerName": "Juan Pérez", "dates": ["2026-08-03","2026-08-10","2026-08-17"], "startTime": "18:00", "endTime": "19:00", "totalAmount": 120, "seriesPaymentMode": "LUMP_SUM" }` | `201` con las 3 reservas creadas, `seriesId` compartido. Repetir con una de las fechas ya ocupada debe devolver `409` y no crear ninguna reserva de la serie (rollback transaccional). |
| 42 | PATCH | `/bookings/:id` | Editar un alquiler existente. | `{ "startTime": "19:00", "endTime": "20:00" }` | `200` con el alquiler actualizado. |
| 43 | POST | `/bookings/:id/cancel` | Cancelar un alquiler. | — | `200`, estado `CANCELLED`. Verificar que sus pagos asociados quedan marcados con `reversedAt` (ver módulo Payments). |
| 44 | GET | `/bookings?courtId=&status=&from=&to=` | Buscar/filtrar alquileres. | — | `200` con el arreglo filtrado. Probar combinaciones de `status=PENDING`, rango de fechas, y `customerId`. |

<br>

**Payments (`/payments`)**

| # | Método | Endpoint | Descripción de la prueba | Body de ejemplo | Resultado esperado |
|---|---|---|---|---|---|
| 45 | POST | `/payments` | Registrar un pago sobre un alquiler. | `{ "bookingId": {{bookingId}}, "amount": 40, "method": "EFECTIVO" }` | `201` con el pago creado. |
| 46 | GET | `/payments/:bookingId` | Listar los pagos de un alquiler. | — | `200` con el arreglo de pagos (incluye los reversados, con su `reversedAt`). |
| 47 | POST | `/payments/:bookingId/receipt` | Subir comprobante de pago (form-data, campo `receipt`). | form-data: `receipt` = archivo `.jpg`/`.pdf` | `200`/`201` con la referencia del archivo guardada. |
| 48 | GET | `/payments/:bookingId/receipt` | Obtener la URL firmada del comprobante. | — | `200` con una URL temporal (300 segundos). Repetir la prueba 6 minutos después debe devolver la URL vencida al abrirla. Sin comprobante cargado debe devolver `404`. |

<br>

**Panel (`/panel`)**

| # | Método | Endpoint | Descripción de la prueba | Resultado esperado |
|---|---|---|---|---|
| 49 | GET | `/panel/todays-bookings` | Consultar los alquileres del día actual. | `200` con el arreglo de alquileres de hoy. |
| 50 | GET | `/panel/todays-revenue` | Consultar el ingreso total del día. | `200` con el monto total calculado sobre los pagos reales. |
| 51 | GET | `/panel/todays-pending-payments` | Consultar los pagos pendientes del día. | `200` con el arreglo de alquileres con saldo pendiente. |

<br>

**Notifications (`/notifications`)**

| # | Método | Endpoint | Descripción de la prueba | Resultado esperado |
|---|---|---|---|---|
| 52 | GET | `/notifications` | Listar las notificaciones internas del usuario autenticado. | `200` con el arreglo de notificaciones. |
| 53 | PATCH | `/notifications/:id/read` | Marcar una notificación como leída. | `200` con la notificación actualizada. |

<br>

**Health (`/health`)**

| # | Método | Endpoint | Descripción de la prueba | Resultado esperado |
|---|---|---|---|---|
| 54 | GET | `/health` | Verificar que la API y la base de datos están operativas. | `200 { "status": "ok" }`. Usado por Render para mantener vivo el servicio en el plan gratuito. |

<br>

#### 7.3.5.3. Evidencia de pruebas en Postman

<br>

![Services Evidence](assets/sprints/sprint-2/services/login.png)
![Services Evidence](assets/sprints/sprint-2/services/login-bad.png)
![Services Evidence](assets/sprints/sprint-2/services/forgot.png)
*Colección de Postman ejecutando el flujo de autenticación (`login`, `forgot-password`, `reset-password`, `logout`) contra la API real.*

<br>

![Services Evidence](assets/sprints/sprint-2/services/bookings.png)
![Services Evidence](assets/sprints/sprint-2/services/getbookings.png)
*Prueba de `POST /bookings` mostrando la respuesta `201` y, en un segundo request idéntico, el `409` que evidencia la validación anti-doble-reserva.*

<br>

![Services Evidence](assets/sprints/sprint-2/services/courts.png)
![Services Evidence](assets/sprints/sprint-2/services/many.png)
*Pruebas del módulo `courts`: creación de cancha, actualización de precio y bloqueo de franja por mantenimiento.*

<br>

![Services Evidence](assets/sprints/sprint-2/services/customer.png)
![Services Evidence](assets/sprints/sprint-2/services/customers.png)
*Pruebas del módulo `customers`: creación, edición y consulta de historial de un cliente.*

<br>

![Services Evidence](assets/sprints/sprint-2/services/payment.png)
*Prueba de `POST /payments` y de la obtención de la URL firmada del comprobante mediante `GET /payments/:bookingId/receipt`.*

<br>

![Services Evidence](assets/sprints/sprint-2/services/healt.png)
*Prueba de `GET /health` verificando la disponibilidad del servicio desplegado en Render (plan gratuito).*

<br>

#### 7.3.5.4. Evidencia de pruebas del servicio de correo (Resend)

| # | Correo | Disparado por | Resultado esperado |
|---|---|---|---|
| 1 | Confirmación de alquiler | `POST /bookings` (con `customerEmail`) | Correo recibido con cancha, fecha y horario del alquiler. |
| 2 | Nueva reserva registrada (alerta a otros administradores) | `POST /bookings`, `POST /bookings/series`, `POST /courts/:id/blocks` | Correo recibido por cada administrador activo distinto de quien registró la reserva/bloqueo. |
| 3 | Nueva solicitud de acceso | `POST /users/requests` | Correo recibido por los administradores existentes con los datos del solicitante. |
| 4 | Solicitud de acceso autorizada/rechazada | `PATCH /users/requests/:id/approve` o `/reject` | Correo recibido por el solicitante con el resultado de su solicitud. |
| 5 | Verificación de correo | Automático tras autorizar una solicitud | Correo con enlace `{{FRONTEND_URL}}/verificar-correo?token=...`, válido por 24 horas. |
| 6 | Restablecimiento de contraseña | `POST /auth/forgot-password` | Correo con enlace `{{FRONTEND_URL}}/restablecer-password?token=...`, válido por 1 hora. |

<br>
<br>

![Services Evidence](assets/sprints/sprint-2/resend-pruebas/pruebas.png)

![Services Evidence](assets/sprints/sprint-2/resend-pruebas/1.png)

![Services Evidence](assets/sprints/sprint-2/resend-pruebas/2.png)
*Dashboard de Resend mostrando los correos entregados exitosamente durante las pruebas.*

<br>

![Services Evidence](assets/sprints/sprint-2/execution/correo1.png)
*Correo real recibido de confirmación de alquiler.*

<br>

![Services Evidence](assets/sprints/sprint-2/resend-pruebas/contraseña.png)
*Correo real recibido de restablecimiento de contraseña, con el botón de acción hacia el frontend.*

<br>

### 7.3.6. Software Deployment Evidence for Sprint Review

*(Sin cambios: despliegue del sistema completo en Render (Static Site + Web Service, plan Free) y Supabase, con el mismo Deployment Process de 5 pasos, la URL pública `lacanchitadecarlos.moli-voleibol.com` y las 11 capturas de evidencia de despliegue ya documentadas.)*

<br>

## 7.4. Definition of Done

*(Sin cambios respecto al documento original.)*

<br>

---

# Capítulo VIII: Implementación

## 8.1. Configuración del Entorno de Desarrollo

<br>

## 8.2. Gestión de Código Fuente

<br>

## 8.3. Convenciones de Código

<br>

## 8.5. Avance por Sprint

<br>

## 8.6. JSON Server (Fake API)

*(Sin cambios respecto al documento original en 8.1 Configuración del Entorno de Desarrollo — herramientas del ciclo de vida, configuración local con `npx prisma migrate dev` y `npm run dev` para ambos repos —, 8.2 Gestión de Código Fuente, 8.3 Convenciones de Código, y 8.5 Avance por Sprint y 8.6 JSON Server. Ninguna cita rutas HTTP en español.)*

## 8.4. Configuración de Despliegue

**Frontend (Render — Static Site):**
- Build Command: `npm run build`
- Publish Directory: `dist`
- Variable de entorno: `VITE_API_URL`

<br>

**Backend (Render — Web Service, plan Free):**
- Build Command: `npm install && npx prisma generate`
- Start Command: `npm run start`
- Health Check Path: `/health` (usado para monitorear el arranque en frío del plan gratuito, no para eliminarlo)
- Variables de entorno: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `SETUP_TOKEN`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`, `FRONTEND_URL`

<br>

**Base de datos (Supabase):**
- PostgreSQL gestionado, con conexión pooled (`DATABASE_URL`) para la aplicación y conexión directa (`DIRECT_URL`) para migraciones.
- Supabase Storage para comprobantes de pago.

<br>

---

# Capítulo IX: Pruebas y Validación

## 9.1. Estrategia de Pruebas

<br>

## 9.3. Validación con el Cliente

*(Sin cambios respecto al documento original en 9.1 Estrategia de Pruebas y 9.3 Validación con el Cliente.)*

## 9.2. Casos de Prueba Clave

<br>

| # | Caso de Prueba | Precondición | Pasos | Resultado Esperado |
|---|---|---|---|---|
| 1 | Registrar un alquiler sin solapamiento | Cancha y horario disponibles | Completar formulario de reserva y confirmar | Se crea el `Booking`, se emite `BookingRegistered` |
| 2 | Rechazar doble reserva | Ya existe un `Booking` activo en ese horario y cancha | Intentar registrar otro alquiler en el mismo horario | Sistema rechaza con mensaje claro, se emite `DoubleBookingRejected` |
| 3 | Bloquear horario con motivo | Horario disponible | Registrar bloqueo con motivo obligatorio | Se crea `ScheduleBlock`, se emite `ScheduleBlocked` |
| 4 | Registrar pago total | Alquiler con saldo pendiente | Registrar pago por el monto total | Estado de pago pasa a `PAGADO`, saldo en 0 |
| 5 | Registrar pago parcial | Alquiler con saldo pendiente | Registrar pago menor al total | Estado pasa a `PARCIAL`, saldo recalculado |
| 6 | Rechazar pago que excede el saldo | Alquiler con saldo pendiente | Intentar pagar un monto mayor al saldo | Sistema rechaza la operación |
| 7 | Solicitar acceso de administrador | Correo no registrado previamente | Completar formulario de solicitud | Se crea `RegistrationRequestCreated`, solicitud queda pendiente |
| 8 | Rechazar solicitud con correo duplicado | Correo ya registrado | Intentar solicitar acceso con ese correo | Sistema rechaza sin crear duplicado |
| 9 | Autorizar solicitud de acceso | Solicitud pendiente, usuario autenticado es el dueño | Autorizar la solicitud | Se emite `AdminAuthorized`, se envía correo al solicitante |
| 10 | Rechazar autorización por usuario no dueño | Solicitud pendiente, usuario autenticado no es el dueño | Intentar autorizar | Sistema responde 403 |
| 11 | Enviar correo de confirmación sin bloquear el registro | Proveedor de correo (Resend) caído | Registrar un alquiler | El alquiler se registra igual; el envío de correo falla de forma aislada (RF24) |
| 12 | Detectar arranque en frío mediante `/health` | Backend desplegado en Render, plan Free, tras un período de inactividad | Consultar `/health` inmediatamente después de la inactividad | El endpoint permite detectar el estado del servicio; no elimina la latencia del arranque en frío. |

<br>

---

# Capítulo X: Despliegue

## 10.1. Ambiente de Producción

<br>

| Componente | Proveedor | Detalle |
|---|---|---|
| Frontend | Render (Static Site) | React + Vite, servido como sitio estático. |
| Backend | Render (Web Service, plan Free) | Express + TypeScript, con arranque en frío tras inactividad; mitigado (no eliminado) mediante el endpoint `/health`. |
| Base de datos | Supabase | PostgreSQL gestionado. |
| Almacenamiento | Supabase Storage | Comprobantes de pago y fotos de cancha. |
| Correo transaccional | Resend | Confirmaciones y notificaciones de autorización. |

<br>

## 10.2. Checklist de Despliegue

<br>

## 10.3. Plan de Rollback

*(10.2 Checklist de Despliegue y 10.3 Plan de Rollback: sin cambios respecto al documento original.)*

<br>

---

# Anexos

<br>

- Repositorio del frontend: https://github.com/brianna-salinas/la-canchita-de-carlos-frontend.git
- Repositorio del backend: https://github.com/brianna-salinas/la-canchita-de-carlos-backend.git
- Prototipo navegable en Figma: https://www.figma.com/site/iprLtSv1JAy2xLH9kklVbt/La-Canchita-de-Carlos?node-id=0-1&t=xrfrClNrYt8S0jPV-1

<br>

---

## Nota final de esta revisión

Este documento incorpora las correcciones derivadas del renombrado de endpoints de español a inglés (`/auth/bootstrap-owner`, `/auth/forgot-password`, `/auth/reset-password`, `/users/requests*`, `/users/verify`, `/users/:id/promote-owner`, `/users/me/email`, `/users/me/password`, `/users/me/profile`, `/users/:id/photo`, `/courts/:id/price`, `/courts/availability`, `/courts/:id/blocks*`, `/courts/:id/photos`, `/customers/:id/history`, `/bookings/series`, `/bookings/:id/cancel`, `/payments/:bookingId/receipt`, `/panel/todays-*`, `/notifications/:id/read`) y la corrección de la contradicción sobre el plan de hosting del backend (Render **Free**, no Starter, consistente en RNF02, 4.6, 4.7.2, 4.7.5, 8.4 y 10.1). Las secciones sin cambios de contenido (User Stories detalladas, Product Backlog, wireframes/mockups, Event Storming, diagramas C4, Database Design, Sprint 1 completo) se marcaron explícitamente como "sin cambios" para que quede claro qué se tocó y qué no en esta pasada.
