# Rediseño del Resumen de Préstamo y Plan de Pagos para el Cliente

Optimización integral del documento imprimible del préstamo para proporcionar máxima claridad y transparencia al cliente, eliminando desgloses técnicos innecesarios (capital e interés separados) e incorporando indicadores clave como monto por cuota, fechas de vencimiento, cuotas faltantes y saldo pendiente.

### User Review & Critical Decisions

> [!IMPORTANT]
> **Decisiones confirmadas por el usuario en la fase de clarificación:**
> - **Enfoque del Documento**: Exclusivamente "Resumen de Préstamo y Plan de Pagos" directo y transparente, omitiendo texto legal contractual o pagaré extenso.
> - **Columnas de la Tabla de Cuotas**: `Cuota Nº`, `Fecha de Vencimiento`, `Monto a Pagar`, `Estado` y `Saldo Restante` (sin discriminar capital ni interés para evitar confusiones al cliente).
> - **Alcance**: Modificación concentrada en la vista e impresión del Resumen y Plan de Pagos del préstamo; el Recibo individual de cobro mantendrá su desglose operativo habitual.

---

### 1. Overview & Core Concept

- **Qué hace**: Transforma el documento impreso que se entrega al prestatario en una hoja ejecutiva, limpia y fácil de interpretar. Destaca de forma prominente cuánto debe pagar por cuota, cuándo vence cada una, cuántas cuotas le quedan por abonar y el saldo remanente.
- **Audiencia objetivo**: Clientes del negocio de préstamos que necesitan un comprobante impreso claro de su cronograma de pagos sin tecnicismos bancarios complejos.
- **Valor aportado**: Reduce reclamos y dudas de los clientes, fomenta la puntualidad en los pagos al destacar las fechas límite y proyecta una imagen profesional e institucional de la empresa.

---

### 2. User Experience & Visual Design

#### A. Flujo de Usuario
1. El operador ingresa a la ficha de un préstamo en `LoanDetail`.
2. Presiona el botón de acción **"Plan de Pagos / Resumen"** (renombrado para mayor precisión).
3. Se despliega el modal de previsualización (`TicketModal`) con un diseño impecable:
   - **Encabezado institucional**: Logotipo en alta calidad (`/logo.svg`), razón social, teléfono, dirección y código de préstamo.
   - **Tarjeta de Estado del Préstamo (Hero Metrics)**:
     - Monto de Cuota Regular (ej. `$ 15,000.00`).
     - Próximo Vencimiento destacado con alerta visual si está próxima o vencida.
     - Progreso de Cuotas: Cuotas pagadas vs. cuotas faltantes (ej. *4 pagadas · 8 faltantes de 12 totales*).
     - Saldo Pendiente Actualizado.
     - Datos de contacto y canales de pago de la empresa (transferencia / caja).
   - **Tabla Limpia de Amortización para el Cliente**:
     - Columnas: `Cuota Nº` | `Vencimiento` | `Monto a Pagar` | `Estado` | `Saldo Restante`.
     - Tipografía monoespaciada/tabular para cifras alineadas a la derecha.
     - Indicador tipográfico de estado (Al día / Pagada / Vencida) sin abusar de píldoras.
   - **Área de Conformidad**: Firmas del cliente y sello de la entidad financiera.
4. El operador presiona **"Imprimir"** y el navegador genera la salida con fidelidad de color (`print-color-adjust: exact`) lista para entregar al cliente.

#### B. Identidad Visual y Estilo
- **Paleta y Jerarquía**: Fondo blanco impoluto para impresión, bordes sutiles en `slate-200`, acentos en `slate-900` para títulos y `emerald-700` para montos favorables o pagados.
- **Tipografía**: Numerales tabulares (`font-mono` / `tabular-nums`) para evitar descuadres en los montos impresos.
- **Micro-estilo**: Cero elementos gráficos superfluos ("anti-slop"), encabezados sobrios y máxima legibilidad en papel tanto en formato A4 como en reportes compactos.

---

### 3. Key Product Decisions & Trade-Offs

- **Decisión 1: Eliminar columnas de Capital e Interés en la vista del cliente**
  - *Enfoque*: Mostrar únicamente el monto total final de la cuota (`Monto a Pagar`) y el `Saldo Restante`.
  - *Por qué*: El cliente final se interesa en saber con exactitud cuánto dinero debe desembolsar en cada fecha y cuánto le resta por liquidar; desglosar capital e interés genera confusiones recurrentes en ventanilla.
  - *Alternativas descartadas*: Mantener desglose en letra pequeña o toggle oculto (descartado por la respuesta explícita del usuario).

- **Decisión 2: Indicador prominente de "Cuotas Faltantes" y "Próxima Fecha Límite"**
  - *Enfoque*: Calcular en tiempo real y mostrar en una tarjeta superior: cantidad de cuotas abonadas, cuotas restantes por pagar, monto estimado de la próxima cuota y fecha exacta del vencimiento más inmediato.
  - *Por qué*: Responde directamente al dolor del cliente mencionado en la solicitud ("la información que se muestra al cliente es poca").

- **Decisión 3: Preservar el recibo de cobro (`type === 'payment'`)**
  - *Enfoque*: Modificar únicamente la sección de `type === 'loan_agreement'` en `TicketModal.tsx`, manteniendo intacto el recibo de cobro con desglose de interés moratorio/ordinario.

---

### 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                      LoanDetail Component                   │
│  - Muestra cartera y detalle del crédito                    │
│  - Botón: "Plan de Pagos / Resumen"                         │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      TicketModal Component                  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Encabezado Institucional (Logo SVG + Datos Empresa)   │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Resumen Ejecutivo para el Cliente:                    │  │
│  │  - Monto Total Financiado                             │  │
│  │  - Cuota Fija / Mensual                               │  │
│  │  - Cuotas Faltantes (X de Y pendientes)               │  │
│  │  - Próximo Vencimiento                                │  │
│  │  - Saldo Total Pendiente                              │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Tabla de Plan de Pagos para el Cliente:               │  │
│  │ [Cuota Nº] [Vencimiento] [Monto Cuota] [Estado] [Saldo│  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Firmas de Conformidad y Políticas de Pago             │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

#### Mapeo de Datos y Cálculos:
- **`cuotasTotales`**: `loan.installments.length` (o `loan.termsCount`).
- **`cuotasPagadas`**: `loan.installments.filter(i => i.status === 'paid').length`.
- **`cuotasFaltantes`**: `cuotasTotales - cuotasPagadas`.
- **`proximoVencimiento`**: `loan.installments.find(i => i.status !== 'paid')?.dueDate`.
- **`proximoMonto`**: `loan.installments.find(i => i.status !== 'paid')?.totalDue || loan.monthlyPayment`.
- **`saldoRestanteActual`**: `loan.outstandingBalance`.
