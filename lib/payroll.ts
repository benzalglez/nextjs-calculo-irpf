export type PayrollResult = {
  year: number;
  grossSalary: number;
  contributionBase: number;
  employerContribution: number;
  employeeContribution: number;
  laborCost: number;
  previousIncome: number;
  fixedExpenses: number;
  workReduction: number;
  taxableBase: number;
  fullTax: number;
  personalMinimumTax: number;
  theoreticalTax: number;
  smiDeduction: number;
  taxAfterSmi: number;
  withholdingLimit: number;
  finalIrpf: number;
  netSalary: number;
  netMonthly: number;
  effectiveEmployeeRate: number;
  companyLoadRate: number;
  bracketQuotas: Array<{ label: string; amount: number; rate: number }>;
};

export type InflationComparison = {
  comparedYear: number;
  equivalentGross2026: number;
  inflationMultiplier: number;
  nominalGross: number;
  adjustedLaborCost: number;
  adjustedEmployerContribution: number;
  adjustedEmployeeContribution: number;
  adjustedIrpf: number;
  adjustedNet: number;
  net2026: number;
  annualPurchasingPowerDelta: number;
  monthlyPurchasingPowerDelta: number;
  currentAnnualPurchasingPowerDelta: number;
  currentMonthlyPurchasingPowerDelta: number;
};

type SocialSecurityTypes = Record<string, [number, number]>;
type Bracket = [number, number];
type SolidarityBracket = [number, number];

type PayrollParams = {
  baseMax: number;
  socialSecurityTypes: SocialSecurityTypes;
  mei: [number, number];
  solidarity: SolidarityBracket[];
  irpfMinimum: number;
  exemptMinimum: number;
  fixedExpenses: number;
  art20Meta: {
    lower: number | "Transitorio";
    maxReduction: number | "Transitorio";
    upper: number | "Transitorio";
    minReduction: number | "Transitorio";
  };
  workReduction: (previousIncome: number) => number;
  irpfBrackets: Bracket[];
  smiDeduction: (grossSalary: number) => number;
};

export const YEARS = Array.from({ length: 15 }, (_, index) => 2012 + index);

const IPC_ANNUAL_DECEMBER: Record<number, number> = {
  2013: 0.003,
  2014: -0.01,
  2015: 0,
  2016: 0.016,
  2017: 0.011,
  2018: 0.012,
  2019: 0.008,
  2020: -0.005,
  2021: 0.065,
  2022: 0.057,
  2023: 0.031,
  2024: 0.028,
  2025: 0.029,
  2026: 0.03,
};

const BASE_MAX_BY_YEAR: Record<number, number> = {
  2012: 39150,
  2013: 41108.4,
  2014: 43164,
  2015: 43272,
  2016: 43704,
  2017: 45014.4,
  2018: 45014.4,
  2019: 48841.2,
  2020: 48841.2,
  2021: 48841.2,
  2022: 49672.8,
  2023: 53946,
  2024: 56646,
  2025: 58914,
  2026: 61214.4,
};

const EXEMPT_MINIMUM_BY_YEAR: Record<number, number> = {
  2012: 11162,
  2013: 11162,
  2014: 11162,
  2015: 12000,
  2016: 12000,
  2017: 12000,
  2018: 12643,
  2019: 14000,
  2020: 14000,
  2021: 14000,
  2022: 14000,
  2023: 15000,
  2024: 15876,
  2025: 15876,
  2026: 15876,
};

const SOCIAL_SECURITY_TYPES: SocialSecurityTypes = {
  comunes: [0.236, 0.047],
  desempleo: [0.055, 0.0155],
  fogasa: [0.002, 0],
  fp: [0.006, 0.001],
  atep: [0.015, 0],
};

export function formatEuro(value: number, digits = 0) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

export function formatPercent(value: number, digits = 1) {
  return new Intl.NumberFormat("es-ES", {
    style: "percent",
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

export function getInflationMultiplier(baseYear: number, targetYear = 2026) {
  if (baseYear === targetYear) {
    return 1;
  }

  let multiplier = 1;
  for (let year = baseYear + 1; year <= targetYear; year += 1) {
    multiplier *= 1 + IPC_ANNUAL_DECEMBER[year];
  }

  return multiplier;
}

function sumContributionType(types: SocialSecurityTypes, index: 0 | 1) {
  return Object.values(types).reduce((total, value) => total + value[index], 0);
}

function getArt20Meta(year: number): PayrollParams["art20Meta"] {
  if (year <= 2014) {
    return { lower: 9180, maxReduction: 4080, upper: 13260, minReduction: 2652 };
  }

  if (year <= 2017) {
    return { lower: 11250, maxReduction: 3700, upper: 14450, minReduction: 0 };
  }

  if (year === 2018) {
    return {
      lower: "Transitorio",
      maxReduction: "Transitorio",
      upper: "Transitorio",
      minReduction: "Transitorio",
    };
  }

  if (year <= 2022) {
    return { lower: 13115, maxReduction: 5565, upper: 16825, minReduction: 0 };
  }

  if (year === 2023) {
    return { lower: 14047.5, maxReduction: 6498, upper: 19747.5, minReduction: 0 };
  }

  return { lower: 14852, maxReduction: 7302, upper: 19747.5, minReduction: 0 };
}

function getMei(year: number): [number, number] {
  if (year === 2023) {
    return [0.005, 0.001];
  }

  if (year === 2024) {
    return [0.0058, 0.0012];
  }

  if (year === 2025) {
    return [0.0067, 0.0013];
  }

  if (year >= 2026) {
    return [0.0075, 0.0015];
  }

  return [0, 0];
}

function getSolidarity(year: number): SolidarityBracket[] {
  if (year === 2025) {
    return [
      [1.1, 0.0092],
      [1.5, 0.01],
      [Number.POSITIVE_INFINITY, 0.0117],
    ];
  }

  if (year >= 2026) {
    return [
      [1.1, 0.0115],
      [1.5, 0.0125],
      [Number.POSITIVE_INFINITY, 0.0146],
    ];
  }

  return [];
}

function getIrpfBrackets(year: number): Bracket[] {
  if (year <= 2014) {
    return [
      [17707, 0.2475],
      [33007, 0.3],
      [53407, 0.4],
      [120000, 0.47],
      [175000, 0.49],
      [300000, 0.51],
      [Number.POSITIVE_INFINITY, 0.52],
    ];
  }

  if (year === 2015) {
    return [
      [12450, 0.195],
      [20200, 0.245],
      [34000, 0.305],
      [60000, 0.38],
      [Number.POSITIVE_INFINITY, 0.46],
    ];
  }

  if (year <= 2020) {
    return [
      [12450, 0.19],
      [20200, 0.24],
      [35200, 0.3],
      [60000, 0.37],
      [Number.POSITIVE_INFINITY, 0.45],
    ];
  }

  return [
    [12450, 0.19],
    [20200, 0.24],
    [35200, 0.3],
    [60000, 0.37],
    [300000, 0.45],
    [Number.POSITIVE_INFINITY, 0.47],
  ];
}

function getWorkReduction(year: number, previousIncome: number) {
  if (year <= 2014) {
    if (previousIncome <= 9180) return 4080;
    if (previousIncome <= 13260) return 4080 - 0.35 * (previousIncome - 9180);
    return 2652;
  }

  if (year <= 2017) {
    if (previousIncome <= 11250) return 3700;
    if (previousIncome <= 14450) return 3700 - 1.15625 * (previousIncome - 11250);
    return 0;
  }

  if (year === 2018) {
    const pre =
      previousIncome <= 11250
        ? 3700
        : previousIncome <= 14450
          ? 3700 - 1.15625 * (previousIncome - 11250)
          : 0;
    const post =
      previousIncome <= 13115
        ? 5565
        : previousIncome <= 16825
          ? Math.max(0, 5565 - 1.5 * (previousIncome - 13115))
          : 0;
    return pre / 2 + post / 2;
  }

  if (year <= 2022) {
    if (previousIncome <= 13115) return 5565;
    if (previousIncome <= 16825) return Math.max(0, 5565 - 1.5 * (previousIncome - 13115));
    return 0;
  }

  if (year === 2023) {
    if (previousIncome <= 14047.5) return 6498;
    if (previousIncome <= 19747.5) return Math.max(0, 6498 - 1.14 * (previousIncome - 14047.5));
    return 0;
  }

  if (previousIncome <= 14852) return 7302;
  if (previousIncome <= 17673.52) return 7302 - 1.75 * (previousIncome - 14852);
  if (previousIncome <= 19747.5) return 2364.34 - 1.14 * (previousIncome - 17673.52);
  return 0;
}

export function getPayrollParams(year: number): PayrollParams {
  return {
    baseMax: BASE_MAX_BY_YEAR[year],
    socialSecurityTypes: SOCIAL_SECURITY_TYPES,
    mei: getMei(year),
    solidarity: getSolidarity(year),
    irpfMinimum: year <= 2014 ? 5151 : 5550,
    exemptMinimum: EXEMPT_MINIMUM_BY_YEAR[year],
    fixedExpenses: year <= 2014 ? 0 : 2000,
    art20Meta: getArt20Meta(year),
    workReduction: (previousIncome: number) => getWorkReduction(year, previousIncome),
    irpfBrackets: getIrpfBrackets(year),
    smiDeduction: (grossSalary: number) => {
      if (year === 2026) {
        if (grossSalary <= 17094) return 590.89;
        return Math.max(0, 590.89 - 0.2 * (grossSalary - 17094));
      }

      if (year === 2025) {
        if (grossSalary <= 16576) return 340;
        if (grossSalary <= 18276) return Math.max(0, 340 - 0.2 * (grossSalary - 16576));
      }

      return 0;
    },
  };
}

function calculateBracketQuotas(taxableBase: number, brackets: Bracket[]) {
  const quotas = brackets.map(([, rate], index) => ({
    label: `T${index + 1} (${Math.round(rate * 1000) / 10}%)`,
    amount: 0,
    rate,
  }));

  if (taxableBase <= 0) {
    return { quotas, total: 0 };
  }

  let lowerLimit = 0;
  let total = 0;

  for (let index = 0; index < brackets.length; index += 1) {
    const [limit, rate] = brackets[index];
    if (taxableBase > limit) {
      const quota = (limit - lowerLimit) * rate;
      quotas[index].amount = quota;
      total += quota;
      lowerLimit = limit;
    } else {
      const quota = (taxableBase - lowerLimit) * rate;
      quotas[index].amount = quota;
      total += quota;
      break;
    }
  }

  return { quotas, total };
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function calculatePayrollCore(grossSalary: number, year = 2026): PayrollResult {
  const params = getPayrollParams(year);
  const contributionBase = Math.min(grossSalary, params.baseMax);
  const baseExcess = Math.max(0, grossSalary - params.baseMax);
  const employerType = sumContributionType(params.socialSecurityTypes, 0) + params.mei[0];
  const employeeType = sumContributionType(params.socialSecurityTypes, 1) + params.mei[1];

  let employerContribution = contributionBase * employerType;
  let employeeContribution = contributionBase * employeeType;

  if (params.solidarity.length > 0 && baseExcess > 0) {
    const tierOneLimit = params.baseMax * 0.1;
    const tierTwoLimit = params.baseMax * 0.5;
    const excessOne = Math.min(baseExcess, tierOneLimit);
    const excessTwo = Math.min(Math.max(0, baseExcess - tierOneLimit), tierTwoLimit - tierOneLimit);
    const excessThree = Math.max(0, baseExcess - tierTwoLimit);
    const solidarityTotal =
      excessOne * params.solidarity[0][1] +
      excessTwo * params.solidarity[1][1] +
      excessThree * params.solidarity[2][1];
    employerContribution += solidarityTotal * (5 / 6);
    employeeContribution += solidarityTotal * (1 / 6);
  }

  const laborCost = grossSalary + employerContribution;
  const previousIncome = grossSalary - employeeContribution;
  const workReduction = params.workReduction(previousIncome);
  const netIncome = Math.max(0, previousIncome - params.fixedExpenses);
  const taxableBase = Math.max(0, netIncome - workReduction);
  const bracketCalculation = calculateBracketQuotas(taxableBase, params.irpfBrackets);
  const personalMinimumTax = params.irpfMinimum * params.irpfBrackets[0][1];
  const theoreticalTax = Math.max(0, bracketCalculation.total - personalMinimumTax);
  const smiDeduction = params.smiDeduction(grossSalary);
  const taxAfterSmi = Math.max(0, theoreticalTax - smiDeduction);
  const withholdingLimit = Math.max(0, (grossSalary - params.exemptMinimum) * 0.43);
  const finalIrpf = Math.min(taxAfterSmi, withholdingLimit);
  const netSalary = grossSalary - employeeContribution - finalIrpf;

  return {
    year,
    grossSalary,
    contributionBase,
    employerContribution,
    employeeContribution,
    laborCost,
    previousIncome,
    fixedExpenses: params.fixedExpenses,
    workReduction,
    taxableBase,
    fullTax: bracketCalculation.total,
    personalMinimumTax,
    theoreticalTax,
    smiDeduction,
    taxAfterSmi,
    withholdingLimit,
    finalIrpf,
    netSalary,
    netMonthly: netSalary / 12,
    effectiveEmployeeRate: grossSalary > 0 ? (employeeContribution + finalIrpf) / grossSalary : 0,
    companyLoadRate: grossSalary > 0 ? employerContribution / grossSalary : 0,
    bracketQuotas: bracketCalculation.quotas,
  };
}

export function calculatePayroll(grossSalary: number, year = 2026): PayrollResult {
  const result = calculatePayrollCore(grossSalary, year);

  return {
    ...result,
    grossSalary: roundMoney(result.grossSalary),
    contributionBase: roundMoney(result.contributionBase),
    employerContribution: roundMoney(result.employerContribution),
    employeeContribution: roundMoney(result.employeeContribution),
    laborCost: roundMoney(result.laborCost),
    previousIncome: roundMoney(result.previousIncome),
    fixedExpenses: roundMoney(result.fixedExpenses),
    workReduction: roundMoney(result.workReduction),
    taxableBase: roundMoney(result.taxableBase),
    fullTax: roundMoney(result.fullTax),
    personalMinimumTax: roundMoney(result.personalMinimumTax),
    theoreticalTax: roundMoney(result.theoreticalTax),
    smiDeduction: roundMoney(result.smiDeduction),
    taxAfterSmi: roundMoney(result.taxAfterSmi),
    withholdingLimit: roundMoney(result.withholdingLimit),
    finalIrpf: roundMoney(result.finalIrpf),
    netSalary: roundMoney(result.netSalary),
    netMonthly: roundMoney(result.netMonthly),
    bracketQuotas: result.bracketQuotas.map((quota) => ({
      ...quota,
      amount: roundMoney(quota.amount),
    })),
  };
}

export function compareInflation(equivalentGross2026: number, comparedYear: number): InflationComparison {
  const multiplier = getInflationMultiplier(comparedYear, 2026);
  const nominalGross = equivalentGross2026 / multiplier;
  const compared = calculatePayrollCore(nominalGross, comparedYear);
  const current = calculatePayrollCore(equivalentGross2026, 2026);
  const adjustedNet = compared.netSalary * multiplier;
  const delta = adjustedNet - current.netSalary;

  return {
    comparedYear,
    equivalentGross2026: roundMoney(equivalentGross2026),
    inflationMultiplier: multiplier,
    nominalGross: roundMoney(nominalGross),
    adjustedLaborCost: roundMoney(compared.laborCost * multiplier),
    adjustedEmployerContribution: roundMoney(compared.employerContribution * multiplier),
    adjustedEmployeeContribution: roundMoney(compared.employeeContribution * multiplier),
    adjustedIrpf: roundMoney(compared.finalIrpf * multiplier),
    adjustedNet: roundMoney(adjustedNet),
    net2026: roundMoney(current.netSalary),
    annualPurchasingPowerDelta: roundMoney(delta),
    monthlyPurchasingPowerDelta: roundMoney(delta / 12),
    currentAnnualPurchasingPowerDelta: roundMoney(-delta),
    currentMonthlyPurchasingPowerDelta: roundMoney(-delta / 12),
  };
}

export function getControlSnapshot(year: number) {
  const params = getPayrollParams(year);
  const employerType = sumContributionType(params.socialSecurityTypes, 0);
  const employeeType = sumContributionType(params.socialSecurityTypes, 1);

  return {
    baseMax: params.baseMax,
    employerSocialSecurity: employerType,
    employeeSocialSecurity: employeeType,
    employerMei: params.mei[0],
    employeeMei: params.mei[1],
    fixedExpenses: params.fixedExpenses,
    irpfMinimum: params.irpfMinimum,
    exemptMinimum: params.exemptMinimum,
    art20Meta: params.art20Meta,
    brackets: params.irpfBrackets,
  };
}
