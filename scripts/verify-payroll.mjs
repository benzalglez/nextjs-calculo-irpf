import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const source = fs.readFileSync("lib/payroll.ts", "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;

const exports = {};
vm.runInNewContext(compiled, { exports, Intl, Math, Number, console });

const { calculatePayroll, compareInflation } = exports;

function approx(actual, expected, label) {
  assert.equal(Number(actual.toFixed(2)), expected, label);
}

const payroll2026 = calculatePayroll(18000, 2026);
approx(payroll2026.employerContribution, 5787, "2026 employer contribution");
approx(payroll2026.employeeContribution, 1170, "2026 employee contribution");
approx(payroll2026.finalIrpf, 623.82, "2026 final IRPF");
approx(payroll2026.netSalary, 16206.19, "2026 net salary");

const comparison2019 = compareInflation(18000, 2019);
approx(comparison2019.nominalGross, 14306.07, "2019 nominal gross");
approx(comparison2019.adjustedNet, 16691.41, "2019 adjusted net");
approx(comparison2019.net2026, 16206.19, "2019 comparison 2026 net");
approx(comparison2019.annualPurchasingPowerDelta, 485.22, "2019 annual delta");
approx(comparison2019.monthlyPurchasingPowerDelta, 40.44, "2019 monthly delta");

const comparison42000 = compareInflation(42000, 2019);
approx(comparison42000.annualPurchasingPowerDelta, 1089.88, "2019 annual delta without intermediate rounding");

const comparison100000 = compareInflation(100000, 2025);
approx(comparison100000.annualPurchasingPowerDelta, 365.78, "2025 annual delta without intermediate rounding");

console.log("Payroll verification passed");
