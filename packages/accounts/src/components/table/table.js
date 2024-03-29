import React, { useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { CSVLink } from 'react-csv'
import Switch from "@mui/material/Switch";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import TableCompo from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableFooter from "@mui/material/TableFooter";
import Paper from "@mui/material/Paper";
import TableContainer from "@mui/material/TableContainer";
import Grid from "@mui/material/Grid";
import { Stack } from "@mui/system";
import Box from "@mui/material/Box";
import FormLabel from "@mui/material/FormLabel";
import FormControl from "@mui/material/FormControl";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Popover from "@mui/material/Popover";
import IconButton from "@mui/material/IconButton";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import Checkbox from "@mui/material/Checkbox";
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';

import { useHistory } from 'react-router-dom';
import "jspdf-autotable";
import jsPDF from "jspdf";

import {
  StyledTableCell,
  StyledTableRow,
  TableHeaderRowContainer,
  TableSortingUpAndDownIconContainer,
  TableSortingIcon,
  FilterContainer,
  PaginationLayout,
  SearchLayout,
  AlignTableCell
} from "./styles";
import DebouncedInputComp from "./debouncedInput";

import ArrowUp from "./assets/arrowUpSvg";
import ArrowDown from "./assets/arrowDownSvg";
import PaginationWithRowSelection from "./pagination";
import { calculatePaginationEntries } from "./utils";

import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";

import {  rankItem } from "@tanstack/match-sorter-utils";

import { makeData } from "./makeData";



var Heading = [
  ["Account Id", "Account Name", "Account Status", "Product Type", 'Date'],
];

const downloadExcel = (data) => {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet([]);
  XLSX.utils.sheet_add_aoa(ws, Heading);

  //Starting in the second row to avoid overriding and skipping headers
  XLSX.utils.sheet_add_json(ws, data, { origin: "A2", skipHeader: true });

  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

  XLSX.writeFile(wb, "filename.xlsx");
};




const fuzzyFilter = (row, columnId, value, addMeta) => {
  // Rank the item
  const itemRank = rankItem(row.getValue(columnId), value);

  // Store the itemRank info
  addMeta({
    itemRank,
  });

  // Return if the item should be filtered in/out
  return itemRank.passed;
};

export default function TableComponent({
  data,
  enableColumnFilters,
  handleChange,
}) {
  const csvLink = useRef()
  const rerender = React.useReducer(() => ({}), {})[1];
  const [columnVisibility, setColumnVisibility] = React.useState({});
  const [columnFilters, setColumnFilters] = React.useState(
    []
  );
  const [globalFilter, setGlobalFilter] = React.useState("");

  const history = useHistory()

  const handleEditClick = (row) => {
    sessionStorage.setItem('row', JSON.stringify(row))
    history.push('/accounts/edit')
  }

  const getTransactionData = () => {
    csvLink.current.link.click()
  }

  const columns = React.useMemo(
    () => [
      {
        accessorKey: "accountId",
        header: () => <span>Account Id</span>,
        // footer: ({ table }) => <h2>Total: {table.getFilteredRowModel().rows.reduce((total, row) => total + row.getValue('accountId'), 0)}</h2>,
      },
      {
        accessorKey: "accountName",
        cell: (info) => info.getValue(),
        header: () => <span>Account Name</span>,
        // footer: (props) => props.column.id,
      },
      {
        accessorKey: "accountStatus",
        header: "Account Status",
        // footer: (props) => props.column.id,
      },
      {
        accessorKey: "productType",
        header: "Product Type",
        // footer: (props) => props.column.id,
      },
      {
        accessorKey: "edit",
        header: () => <AlignTableCell position="center"></AlignTableCell>,
        enableColumnFilter: false,
        enableSorting: false,
        cell: ({ row }) => <AlignTableCell position="center">
          <EditOutlinedIcon sx={{ cursor: 'pointer' }} onClick={() => handleEditClick(row.original)}></EditOutlinedIcon>
          <DeleteOutlined sx={{ cursor: 'pointer', ml: 2 }} onClick={() => console.log(row.original)}></DeleteOutlined>
        </AlignTableCell>,

        // footer: (props) => props.column.id,
      },
    ],
    []
  );

  const [{ pageIndex, pageSize }, setPagination] =
    React.useState({
      pageIndex: 0,
      pageSize: 10,
    });

  const [paginationEntries, setPaginationEntries] = React.useState({});

  const pagination = React.useMemo(
    () => ({
      pageIndex,
      pageSize,
    }),
    [pageIndex, pageSize]
  );

  useEffect(() => {
    const result = calculatePaginationEntries(
      data?.length,
      table.getState().pagination.pageIndex + 1,
      pageSize
    );
    setPaginationEntries(result);
  }, [pageIndex, data, pageSize]);

  const table = useReactTable({
    data,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    state: {
      columnVisibility,
      columnFilters,
      globalFilter,
      pagination,
    },
    onPaginationChange: setPagination,
    onColumnVisibilityChange: setColumnVisibility,
    enableColumnFilters,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    debugTable: true,
    debugHeaders: true,
    debugColumns: false,
  });

  const paginationProps = {
    totalCount: data?.length,
    pageEntries: `${paginationEntries.from} - ${paginationEntries.to} of `,
    nextPage: () => table.nextPage(),
    previousPage: () => table.previousPage(),
    canPreviousPage: !table.getCanPreviousPage(),
    canNextPage: !table.getCanNextPage(),
  };

  // useEffect(() => {
  //   let fdata = table.getRowModel().rows.map((row) => row.original);
  //   // console.log(JSON.stringify(fdata,null,2))
  //   setFilteredData(fdata);
  // }, [table.getRowModel().rows]);

  const print = (data) => {
    const pdf = new jsPDF("p", "pt", "a4");
    const columns = ["Account Id", "Account Name", "Account Status", "Product Type", 'Date']

    var rows = data.map(Object.values);

    // var rows = [];

    // for (let i = 0; i < json.length; i++) {
    //   /*for (var key in json[i]) {
    //     var temp = [key, json[i][key]];
    //     rows.push(temp);
    //   }*/
    //   var temp = [
    //     json[i].id,
    //     json[i].start.split("T")[0],
    //     json[i].duration,
    //     json[i].name,
    //     json[i].project,
    //     json[i].task,
    //     json[i].comment
    //   ];
    //   rows.push(temp);
    // }

    // pdf.text(235, 40, "Tabla de Prestamo");
    pdf.autoTable(columns, rows,
      //   {
      //   startY: 65,
      //   theme: "grid",
      //   styles: {
      //     font: "times",
      //     halign: "center",
      //     cellPadding: 3.5,
      //     lineWidth: 0.5,
      //     lineColor: [0, 0, 0],
      //     textColor: [0, 0, 0]
      //   },
      //   headStyles: {
      //     textColor: [0, 0, 0],
      //     fontStyle: "normal",
      //     lineWidth: 0.5,
      //     lineColor: [0, 0, 0],
      //     fillColor: [166, 204, 247]
      //   },
      //   alternateRowStyles: {
      //     fillColor: [212, 212, 212],
      //     textColor: [0, 0, 0],
      //     lineWidth: 0.5,
      //     lineColor: [0, 0, 0]
      //   },
      //   rowStyles: {
      //     lineWidth: 0.5,
      //     lineColor: [0, 0, 0]
      //   },
      //   tableLineColor: [0, 0, 0]
      // }
    );
    // console.log(pdf.output("datauristring"));
    pdf.save("output");
  };


  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "60px",
        }}
      >
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={enableColumnFilters}
                onChange={handleChange}
                inputProps={{ "aria-label": "controlled" }}
                size="small"
              />
            }
            label="Enable Column Filter"
          />
        </FormGroup>
        <ColumnVisibilityContainerComponent table={table} />
      </div>
      <div>
        <div>
          <FilterContainer container>
            <Grid
              item
              xs={12}
              sm={12}
              md={12}
              lg={12}
              display="flex"
              justifyContent={"space-between"}
            >
              <SearchLayout item xs={12} sm={12} md={4} lg={4} mb={1}>
                <DebouncedInputComp
                  value={globalFilter ?? ""}
                  onChange={(value) => setGlobalFilter(String(value))}
                  placeholder={"Search..."}
                />
              </SearchLayout>
              <Grid
                item
                xs={12}
                sm={12}
                md={4}
                lg={4}
                mb={1}
                display="flex"
                justifyContent="end"
              >
                <ButtonGroup
                  variant="outlined"
                  size="small"
                  aria-label="outlined primary button group"
                >
                  <Button onClick={() => downloadExcel(data)}>xlsx</Button>
                  <Button onClick={() => getTransactionData()}>CSV</Button>
                  <Button onClick={() => print(data)}>PDF</Button>

                </ButtonGroup>
                <CSVLink
                  data={data}
                  filename='transactions.csv'
                  className='hidden'
                  ref={csvLink}
                  target='_blank'
                />
              </Grid>
            </Grid>
          </FilterContainer>

          <div className="h-2" />
          <TableContainer component={Paper}>
            <TableCompo
              sx={{
                "& .MuiTableRow-root:hover": {
                  backgroundColor: "#eff5ff",
                },
              }}
              stickyHeader
              aria-label="caption table"
              data-testid="table"
            >
              <TableHead sx={{ display: "table-header-group" }}>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <>
                          <StyledTableCell
                            key={header.id}
                            colSpan={header.colSpan}
                          >
                            {header.isPlaceholder ? null : header.column.getCanSort() ? (
                              <TableHeaderRowContainer
                                center={+header.column.getCanSort()}
                                {...{
                                  onClick:
                                    header.column.getToggleSortingHandler(),
                                }}
                              >
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                                {{
                                  asc: <TableSortingIcon as={ArrowUp} />,
                                  desc: <TableSortingIcon as={ArrowDown} />,
                                }[
                                  header.column.getIsSorted()
                                ] ?? (
                                    <TableSortingUpAndDownIconContainer>
                                      <TableSortingIcon as={ArrowUp} />
                                      <TableSortingIcon as={ArrowDown} />
                                    </TableSortingUpAndDownIconContainer>
                                  )}
                              </TableHeaderRowContainer>
                            ) : (
                              <TableHeaderRowContainer
                                center={+header.column.getCanSort()}
                              >
                                {" "}
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                              </TableHeaderRowContainer>
                            )}
                            {header.column.getCanFilter() ? (
                              <div>
                                <Filter
                                  column={header.column}
                                  table={table}
                                />
                              </div>
                            ) : null}
                          </StyledTableCell>
                        </>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHead>
              <TableBody>
                {table.getRowModel().rows.map((row) => {
                  return (
                    <StyledTableRow
                      key={row.id}
                      className={`table-expanded-depth-${row.depth}`}
                    >
                      {row.getVisibleCells().map((cell) => {
                        return (
                          <StyledTableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </StyledTableCell>
                        );
                      })}
                    </StyledTableRow>
                  );
                })}
              </TableBody>
              <TableFooter>
                {table.getFooterGroups().map((footerGroup) => (
                  <StyledTableRow key={footerGroup.id}>
                    {footerGroup.headers.map((header) => (
                      <StyledTableCell key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.footer,
                            header.getContext()
                          )}
                      </StyledTableCell>
                    ))}
                  </StyledTableRow>
                ))}
              </TableFooter>
            </TableCompo>
            <>
              <Stack sx={{ display: "flex", justifyContent: "flex-end" }}>
                <PaginationLayout>
                  <PaginationWithRowSelection
                    paginationProps={paginationProps}
                    table={table}
                  />
                </PaginationLayout>
              </Stack>
            </>
          </TableContainer>

          {/* <div>{table.getPrePaginationRowModel().rows.length} Rows</div>
      <div>
        <button onClick={() => rerender()}>Force Rerender</button>
      </div>
      <div>
        <button onClick={() => refreshData()}>Refresh Data</button>
      </div>
      <pre>{JSON.stringify(table.getState(), null, 2)}</pre> */}
        </div>
      </div>
    </>
  );
}

function Filter({
  column,
  table,
}) {
  const firstValue = table
    .getPreFilteredRowModel()
    .flatRows[0]?.getValue(column.id);

  const columnFilterValue = column.getFilterValue();

  const sortedUniqueValues = React.useMemo(
    () =>
      typeof firstValue === "number"
        ? []
        : Array.from(column.getFacetedUniqueValues().keys()).sort(),
    [column.getFacetedUniqueValues()]
  );

  return typeof firstValue === "number" ? (
    <div style={{ marginTop: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <DebouncedInput
            type="number"
            min={Number(column.getFacetedMinMaxValues()?.[0] ?? "")}
            max={Number(column.getFacetedMinMaxValues()?.[1] ?? "")}
            value={(columnFilterValue)?.[0] ?? ""}
            onChange={(value) =>
              column.setFilterValue((old) => [
                value,
                old?.[1],
              ])
            }
            placeholder={`Min ${column.getFacetedMinMaxValues()?.[0]
              ? `(${column.getFacetedMinMaxValues()?.[0]})`
              : ""
              }`}
            className="w-24 border shadow rounded"
          />
        </div>
        <div style={{ marginLeft: "10px" }}>
          <DebouncedInput
            type="number"
            min={Number(column.getFacetedMinMaxValues()?.[0] ?? "")}
            max={Number(column.getFacetedMinMaxValues()?.[1] ?? "")}
            value={(columnFilterValue)?.[1] ?? ""}
            onChange={(value) =>
              column.setFilterValue((old) => [
                old?.[0],
                value,
              ])
            }
            placeholder={`Max ${column.getFacetedMinMaxValues()?.[1]
              ? `(${column.getFacetedMinMaxValues()?.[1]})`
              : ""
              }`}
            className="w-24 border shadow rounded"
          />
        </div>
      </div>
      <div className="h-1" />
    </div>
  ) : (
    <div style={{ marginTop: "10px" }}>
      <datalist id={column.id + "list"}>
        {sortedUniqueValues.slice(0, 5000).map((value) => (
          <option value={value} key={value} />
        ))}
      </datalist>
      <DebouncedInput
        type="text"
        value={(columnFilterValue ?? "")}
        onChange={(value) => column.setFilterValue(value)}
        placeholder={`Search... (${column.getFacetedUniqueValues().size})`}
        className="w-36 border shadow rounded"
        list={column.id + "list"}
      />
      <div className="h-1" />
    </div>
  );
}

// A debounced input react component
function DebouncedInput({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}) {
  const [value, setValue] = React.useState(initialValue);

  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
    }, debounce);

    return () => clearTimeout(timeout);
  }, [value]);

  return (
    <input
      {...props}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      style={{ border: "1px solid black", borderRadius: "4px", padding: "8px" }}
    />
  );
}

function ColumnVisibilityComponent({ table }) {
  return (
    <Box sx={{ display: "flex" }}>
      <FormControl sx={{ m: 3 }} component="fieldset" variant="standard">
        <FormLabel component="legend">Columns</FormLabel>
        <FormGroup>
          {table
            .getAllLeafColumns()
            .map(
              (column, index) => {
                return (
                  <FormControlLabel
                    key={index}
                    control={
                      <Checkbox
                        checked={column.getIsVisible()}
                        onChange={column.getToggleVisibilityHandler()}
                        name="gilad"
                      />
                    }
                    label={column.id}
                  />
                );
              }
            )}
        </FormGroup>
      </FormControl>
    </Box>
  );
}

function ColumnVisibilityContainerComponent({ table }) {
  const [anchorEl, setAnchorEl] = React.useState(
    null
  );

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? "simple-popover" : undefined;

  return (
    <div>
      <IconButton
        color="primary"
        aria-label=" Show/Hide Columns"
        onClick={handleClick}
      >
        <VisibilityOffIcon />
      </IconButton>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
      >
        <ColumnVisibilityComponent table={table} />
      </Popover>
    </div>
  );
}
