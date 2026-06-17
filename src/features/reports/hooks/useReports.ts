import { useCallback, useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

import type { ReportsSummary, ReportFilterState } from "../types";

function currentMonthRange() {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  return {
    startDate: toInputDate(firstDay),
    endDate: toInputDate(lastDay),
  };
}

function toInputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function defaultReportFilters(): ReportFilterState {
  const month = currentMonthRange();

  return {
    startDate: month.startDate,
    endDate: month.endDate,
    accountId: "",
    categoryId: "",
    transactionType: "",
    currency: "",
  };
}

function readableErrorMessage(err: unknown) {
  const rawMessage = err instanceof Error ? err.message : String(err ?? "");
  const message = rawMessage.replace(/^Error:\s*/i, "").trim();
  const lowerMessage = message.toLowerCase();

  if (!message) {
    return "Unable to load reports. Please try again.";
  }

  if (
    message.includes("\n") ||
    lowerMessage.includes("stack") ||
    lowerMessage.includes("sql") ||
    lowerMessage.includes("database")
  ) {
    return "Unable to calculate reports from the local database.";
  }

  return message.length > 160 ? "Unable to load reports. Please try again." : message;
}

export function useReports() {
  const [filters, setFilters] = useState<ReportFilterState>(defaultReportFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<ReportFilterState>(defaultReportFilters);
  const [summary, setSummary] = useState<ReportsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const request = useMemo(
    () => ({
      startDate: appliedFilters.startDate,
      endDate: appliedFilters.endDate,
      accountId: appliedFilters.accountId || null,
      categoryId: appliedFilters.categoryId || null,
      transactionType: appliedFilters.transactionType || null,
      currency: appliedFilters.currency || null,
    }),
    [appliedFilters],
  );

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const nextSummary = await invoke<ReportsSummary>("get_reports_summary", {
        request,
      });
      setSummary(nextSummary);
    } catch (err) {
      setError(readableErrorMessage(err));
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  }, [request]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  function updateFilters(changes: Partial<ReportFilterState>) {
    setFilters((current) => ({ ...current, ...changes }));
  }

  function applyFilters() {
    setAppliedFilters(filters);
  }

  function applyFilterChanges(changes: Partial<ReportFilterState>) {
    const nextFilters = { ...filters, ...changes };
    setFilters(nextFilters);
    setAppliedFilters(nextFilters);
  }

  function resetFilters() {
    const nextFilters = defaultReportFilters();
    setFilters(nextFilters);
    setAppliedFilters(nextFilters);
  }

  return {
    appliedFilters,
    filters,
    summary,
    isLoading,
    error,
    updateFilters,
    applyFilters,
    applyFilterChanges,
    resetFilters,
    reloadReports: loadReports,
  };
}
