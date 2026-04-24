"use client";

import { useMemo, useState } from "react";
import {
  YEARS,
  calculatePayroll,
  compareInflation,
  formatEuro,
  formatPercent,
  getControlSnapshot,
} from "@/lib/payroll";

const MIN_SALARY = 0;
const MAX_SALARY = 100000;
const DEFAULT_SALARY = 42000;
const DEFAULT_YEAR = 2026;
const DEFAULT_COMPARISON_YEAR = 2019;
const COMPARISON_YEARS = YEARS.filter((optionYear) => optionYear < 2026);

function clampSalary(value: number) {
  if (!Number.isFinite(value)) {
    return DEFAULT_SALARY;
  }

  return Math.min(MAX_SALARY, Math.max(MIN_SALARY, Math.round(value)));
}

function formatSignedEuro(value: number, digits = 0) {
  if (value > 0) {
    return `+${formatEuro(value, digits)}`;
  }

  if (value < 0) {
    return `-${formatEuro(Math.abs(value), digits)}`;
  }

  return formatEuro(0, digits);
}

function Metric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "positive" | "warning";
}) {
  return (
    <article className={`metric metric-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function FlowRow({ label, value, max }: { label: string; value: number; max: number }) {
  const width = max > 0 ? Math.max(2, Math.min(100, (value / max) * 100)) : 0;

  return (
    <div className="flow-row">
      <div className="flow-copy">
        <span>{label}</span>
        <strong>{formatEuro(value)}</strong>
      </div>
      <div className="flow-track" aria-hidden="true">
        <span style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export function PayrollOnePage() {
  const [salary, setSalary] = useState(DEFAULT_SALARY);
  const [year, setYear] = useState(DEFAULT_YEAR);
  const [comparisonYear, setComparisonYear] = useState(DEFAULT_COMPARISON_YEAR);

  const payroll = useMemo(() => calculatePayroll(salary, year), [salary, year]);
  const comparison = useMemo(() => compareInflation(salary, comparisonYear), [salary, comparisonYear]);
  const control = useMemo(() => getControlSnapshot(year), [year]);
  const maxFlowValue = Math.max(payroll.laborCost, payroll.grossSalary, payroll.netSalary);
  const currentYearDelta = comparison.currentAnnualPurchasingPowerDelta;
  const currentMonthlyDelta = comparison.currentMonthlyPurchasingPowerDelta;
  const currentYearLosesNetSalary = currentYearDelta < 0;
  const deltaLabel = currentYearLosesNetSalary
    ? `Pérdida neta frente a ${comparisonYear}`
    : `Mejora neta frente a ${comparisonYear}`;

  return (
    <main>
      <section className="hero-section">
        <div className="hero-media" aria-hidden="true" />
        <nav className="topbar" aria-label="Navegación principal">
          <a href="#simulador">Simulador</a>
          <a href="#inflacion">Inflación</a>
          <a href="#metodo">Método</a>
        </nav>

        <div className="hero-content">
          <p className="eyebrow">Auditoría de nóminas 2012-2026</p>
          <h1>Calcula el coste real del salario en España</h1>
          <p className="hero-lede">
            Una onepage interactiva basada en tu motor: cotizaciones de empresa y trabajador, IRPF, neto anual, neto
            mensual y comparativa de poder adquisitivo ajustada por IPC.
          </p>
          <div className="hero-actions">
            <a href="#simulador" className="primary-action">
              Probar salario
            </a>
            <a href="#metodo" className="secondary-action">
              Ver parámetros
            </a>
          </div>
        </div>
      </section>

      <section id="simulador" className="tool-section">
        <div className="section-heading">
          <p className="eyebrow">Simulador anual</p>
          <h2>Nómina, IRPF y coste laboral</h2>
          <p>
            Ajusta un salario bruto anual y el ejercicio fiscal. Los resultados mantienen el criterio del notebook,
            incluyendo MEI, cuota de solidaridad, reducción de rendimientos y límite de retención.
          </p>
        </div>

        <div className="calculator-layout">
          <aside className="control-panel" aria-label="Controles del simulador">
            <label className="field">
              <span>Salario bruto anual</span>
              <input
                type="number"
                min={MIN_SALARY}
                max={MAX_SALARY}
                step={500}
                value={salary}
                onChange={(event) => setSalary(clampSalary(Number(event.target.value)))}
              />
            </label>
            <input
              className="salary-range"
              aria-label="Rango de salario bruto anual"
              type="range"
              min={MIN_SALARY}
              max={MAX_SALARY}
              step={500}
              value={salary}
              onChange={(event) => setSalary(clampSalary(Number(event.target.value)))}
            />

            <label className="field">
              <span>Año fiscal</span>
              <select value={year} onChange={(event) => setYear(Number(event.target.value))}>
                {YEARS.map((optionYear) => (
                  <option key={optionYear} value={optionYear}>
                    {optionYear}
                  </option>
                ))}
              </select>
            </label>

            <div className="year-grid" aria-label="Selector rápido de año fiscal">
              {YEARS.map((optionYear) => (
                <button
                  key={optionYear}
                  type="button"
                  className={optionYear === year ? "active" : undefined}
                  onClick={() => setYear(optionYear)}
                >
                  {optionYear}
                </button>
              ))}
            </div>
          </aside>

          <div className="results-panel">
            <div className="metrics-grid">
              <Metric label="Coste laboral" value={formatEuro(payroll.laborCost)} />
              <Metric label="Salario neto anual" value={formatEuro(payroll.netSalary)} tone="positive" />
              <Metric label="Neto mensual en 12 pagas" value={formatEuro(payroll.netMonthly)} tone="positive" />
              <Metric label="IRPF final" value={formatEuro(payroll.finalIrpf)} tone="warning" />
            </div>

            <div className="flow-panel">
              <FlowRow label="Coste total empresa" value={payroll.laborCost} max={maxFlowValue} />
              <FlowRow label="Salario bruto" value={payroll.grossSalary} max={maxFlowValue} />
              <FlowRow label="Cotización trabajador" value={payroll.employeeContribution} max={maxFlowValue} />
              <FlowRow label="IRPF final" value={payroll.finalIrpf} max={maxFlowValue} />
              <FlowRow label="Neto trabajador" value={payroll.netSalary} max={maxFlowValue} />
            </div>
          </div>
        </div>
      </section>

      <section className="detail-band">
        <div className="section-heading compact">
          <p className="eyebrow">Desglose</p>
          <h2>Qué ocurre dentro del cálculo</h2>
        </div>

        <div className="breakdown-grid">
          <article className="breakdown-card">
            <span>Base de cotización</span>
            <strong>{formatEuro(payroll.contributionBase)}</strong>
            <p>Cotización empresa: {formatEuro(payroll.employerContribution)}.</p>
          </article>
          <article className="breakdown-card">
            <span>Base imponible</span>
            <strong>{formatEuro(payroll.taxableBase)}</strong>
            <p>
              Reducción trabajo: {formatEuro(payroll.workReduction)}. Gastos fijos:{" "}
              {formatEuro(payroll.fixedExpenses)}.
            </p>
          </article>
          <article className="breakdown-card">
            <span>Tipo efectivo trabajador</span>
            <strong>{formatPercent(payroll.effectiveEmployeeRate)}</strong>
            <p>Cotización e IRPF frente al bruto anual seleccionado.</p>
          </article>
          <article className="breakdown-card">
            <span>Carga empresa sobre bruto</span>
            <strong>{formatPercent(payroll.companyLoadRate)}</strong>
            <p>Incluye contingencias, desempleo, FOGASA, formación, ATEP y MEI.</p>
          </article>
        </div>

        <div className="bracket-strip" aria-label="Cuotas por tramo de IRPF">
          {payroll.bracketQuotas.map((quota) => (
            <div key={quota.label} className="bracket-item">
              <span>{quota.label}</span>
              <strong>{formatEuro(quota.amount)}</strong>
            </div>
          ))}
        </div>
      </section>

      <section id="inflacion" className="inflation-section">
        <div className="section-heading">
          <p className="eyebrow">Comparativa IPC</p>
          <h2>El mismo salario visto en euros de 2026</h2>
          <p>
            El salario de 2026 se compara contra el bruto nominal equivalente del año seleccionado, reexpresado en
            euros de 2026. Si el resultado es negativo, has perdido salario neto frente a ese año.
          </p>
        </div>

        <div className="inflation-layout">
          <div className="control-panel slim">
            <label className="field">
              <span>Comparar 2026 frente a</span>
              <select value={comparisonYear} onChange={(event) => setComparisonYear(Number(event.target.value))}>
                {COMPARISON_YEARS.map((optionYear) => (
                  <option key={optionYear} value={optionYear}>
                    {optionYear}
                  </option>
                ))}
              </select>
            </label>
            <div className="delta-badge" data-loss={currentYearLosesNetSalary}>
              <span>{deltaLabel}</span>
              <strong>{formatSignedEuro(currentYearDelta)}</strong>
              <small>
                2026 - {comparisonYear} = {formatSignedEuro(currentYearDelta)} al año ·{" "}
                {formatSignedEuro(currentMonthlyDelta)} al mes
              </small>
            </div>
          </div>

          <div className="comparison-grid">
            <Metric label={`Bruto nominal en ${comparisonYear}`} value={formatEuro(comparison.nominalGross)} />
            <Metric
              label="IPC acumulado"
              value={formatPercent(comparison.inflationMultiplier - 1, 2)}
              tone="warning"
            />
            <Metric label={`Neto ${comparisonYear} actualizado a 2026`} value={formatEuro(comparison.adjustedNet)} />
            <Metric label="Neto con reglas 2026" value={formatEuro(comparison.net2026)} tone="positive" />
          </div>
        </div>
      </section>

      <section id="metodo" className="method-section">
        <div className="section-heading compact">
          <p className="eyebrow">Control normativo</p>
          <h2>Parámetros activos para {year}</h2>
        </div>

        <div className="method-grid">
          <article>
            <span>Base máxima anual</span>
            <strong>{formatEuro(control.baseMax)}</strong>
          </article>
          <article>
            <span>SS empresa</span>
            <strong>{formatPercent(control.employerSocialSecurity)}</strong>
          </article>
          <article>
            <span>SS trabajador</span>
            <strong>{formatPercent(control.employeeSocialSecurity)}</strong>
          </article>
          <article>
            <span>MEI empresa / trabajador</span>
            <strong>
              {formatPercent(control.employerMei, 2)} / {formatPercent(control.employeeMei, 2)}
            </strong>
          </article>
          <article>
            <span>Mínimo contribuyente</span>
            <strong>{formatEuro(control.irpfMinimum)}</strong>
          </article>
          <article>
            <span>Mínimo exento retención</span>
            <strong>{formatEuro(control.exemptMinimum)}</strong>
          </article>
        </div>
      </section>
    </main>
  );
}
