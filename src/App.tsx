import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { InputSelect } from "./components/InputSelect";
import { Instructions } from "./components/Instructions";
import { Transactions } from "./components/Transactions";
import { useEmployees } from "./hooks/useEmployees";
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions";
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee";
import { EMPTY_EMPLOYEE } from "./utils/constants";
import { Employee } from "./utils/types";

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees();
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } =
    usePaginatedTransactions();
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } =
    useTransactionsByEmployee();
  const [isLoading, setIsLoading] = useState(false);
  const [isNextTransaction, setNextTransaction] = useState(true);

  const transactions = useMemo(
    () => paginatedTransactions?.data ?? transactionsByEmployee ?? null,
    [paginatedTransactions, transactionsByEmployee]
  );

  const loadAllTransactions = useCallback(async () => {

    await employeeUtils.fetchAll();
    await paginatedTransactionsUtils.fetchAll();

  }, [employeeUtils, paginatedTransactionsUtils]);

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      if (employeeId === "all") {
        await loadAllTransactions();
      } else {
        paginatedTransactionsUtils.invalidateData();
        await transactionsByEmployeeUtils.fetchById(employeeId);
      }
    },
    [
      loadAllTransactions,
      paginatedTransactionsUtils,
      transactionsByEmployeeUtils,
    ]
  );

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      setIsLoading(true);
      loadAllTransactions();
      setIsLoading(false);
    }
  }, [employeeUtils.loading, employees, loadAllTransactions]);

  useEffect(() => {
    if (paginatedTransactions) {
      setNextTransaction(paginatedTransactions.nextPage !== null);
    }
  }, [paginatedTransactions]);

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={isLoading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            if (newValue === null || newValue.id === "all") {
              setNextTransaction(true);
              await loadAllTransactions();
              return;
            }

            await loadTransactionsByEmployee(newValue.id);
            setNextTransaction(false);
          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions transactions={transactions} />

          {transactions !== null && isNextTransaction && (
            <button
              className="RampButton"
              disabled={paginatedTransactionsUtils.loading}
              onClick={async () => {
                await loadAllTransactions();
              }}
            >
              View More
            </button>
          )}
        </div>
      </main>
    </Fragment>
  );
}
