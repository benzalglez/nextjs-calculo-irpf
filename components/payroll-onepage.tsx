"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

function clampYear(value: number, fallback = DEFAULT_YEAR) {
  return YEARS.includes(value) ? value : fallback;
}

function clampComparisonYear(value: number, fallback = DEFAULT_COMPARISON_YEAR) {
  return COMPARISON_YEARS.includes(value) ? value : fallback;
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
  tone?: "default" | "positive" | "warning" | "loss";
}) {
  return (
    <article className={`metric metric-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function FlowRow({
  label,
  value,
  max,
  variant = "neutral",
}: {
  label: string;
  value: number;
  max: number;
  variant?: "neutral" | "cost" | "tax" | "net";
}) {
  const width = max > 0 ? Math.max(2, Math.min(100, (value / max) * 100)) : 0;

  return (
    <div className={`flow-row flow-${variant}`}>
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
  const [salaryInput, setSalaryInput] = useState(String(DEFAULT_SALARY));
  const [year, setYear] = useState(DEFAULT_YEAR);
  const [comparisonYear, setComparisonYear] = useState(DEFAULT_COMPARISON_YEAR);
  const didReadUrl = useRef(false);

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const salaryParam = params.get("salary");
    const yearParam = params.get("year");
    const compareParam = params.get("compare");

    if (salaryParam) {
      const nextSalary = clampSalary(Number(salaryParam));
      setSalary(nextSalary);
      setSalaryInput(String(nextSalary));
    }

    if (yearParam) {
      setYear(clampYear(Number(yearParam)));
    }

    if (compareParam) {
      setComparisonYear(clampComparisonYear(Number(compareParam)));
    }

    didReadUrl.current = true;
  }, []);

  useEffect(() => {
    if (!didReadUrl.current) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    params.set("salary", String(salary));
    params.set("year", String(year));
    params.set("compare", String(comparisonYear));
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}${window.location.hash}`);
  }, [salary, year, comparisonYear]);

  function commitSalaryInput() {
    const nextSalary = clampSalary(Number(salaryInput));
    setSalary(nextSalary);
    setSalaryInput(String(nextSalary));
  }

  function updateSalary(nextSalary: number) {
    const clampedSalary = clampSalary(nextSalary);
    setSalary(clampedSalary);
    setSalaryInput(String(clampedSalary));
  }

  return (
    <>
      <a className="skip-link" href="#simulador">
        Saltar al simulador
      </a>
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
                name="grossSalary"
                inputMode="numeric"
                autoComplete="off"
                min={MIN_SALARY}
                max={MAX_SALARY}
                step={500}
                value={salaryInput}
                aria-describedby="salary-help"
                onBlur={commitSalaryInput}
                onChange={(event) => setSalaryInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    commitSalaryInput();
                  }
                }}
              />
              <small id="salary-help">Bruto anual en euros. La comparativa IPC toma este importe como salario 2026.</small>
            </label>
            <input
              className="salary-range"
              aria-label="Rango de salario bruto anual"
              name="grossSalaryRange"
              type="range"
              min={MIN_SALARY}
              max={MAX_SALARY}
              step={500}
              value={salary}
              onChange={(event) => updateSalary(Number(event.target.value))}
            />

            <label className="field">
              <span>Año fiscal</span>
              <select
                name="fiscalYear"
                autoComplete="off"
                value={year}
                onChange={(event) => setYear(clampYear(Number(event.target.value)))}
              >
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
                  aria-pressed={optionYear === year}
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
              <FlowRow label="Coste total empresa" value={payroll.laborCost} max={maxFlowValue} variant="cost" />
              <FlowRow label="Salario bruto" value={payroll.grossSalary} max={maxFlowValue} />
              <FlowRow label="Cotización trabajador" value={payroll.employeeContribution} max={maxFlowValue} variant="tax" />
              <FlowRow label="IRPF final" value={payroll.finalIrpf} max={maxFlowValue} variant="tax" />
              <FlowRow label="Neto trabajador" value={payroll.netSalary} max={maxFlowValue} variant="net" />
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
            La comparativa siempre toma el bruto introducido como salario 2026. Se contrasta contra el bruto nominal
            equivalente del año histórico y ambos netos se expresan en euros de 2026.
          </p>
        </div>

        <div className="inflation-layout">
          <div className="control-panel slim">
            <label className="field">
              <span>Año histórico de referencia</span>
              <select
                name="comparisonYear"
                autoComplete="off"
                value={comparisonYear}
                onChange={(event) => setComparisonYear(clampComparisonYear(Number(event.target.value)))}
              >
                {COMPARISON_YEARS.map((optionYear) => (
                  <option key={optionYear} value={optionYear}>
                    {optionYear}
                  </option>
                ))}
              </select>
            </label>
            <div className="delta-badge" data-loss={currentYearLosesNetSalary}>
              <span>{deltaLabel}</span>
              <strong>{formatSignedEuro(currentYearDelta)} al año</strong>
              <small>
                Neto 2026 - neto {comparisonYear} actualizado = {formatSignedEuro(currentYearDelta)} ·{" "}
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
            <Metric
              label="Neto 2026 con el bruto seleccionado"
              value={formatEuro(comparison.net2026)}
              tone={currentYearLosesNetSalary ? "loss" : "positive"}
            />
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
    </>
  );
}
