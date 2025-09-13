"use client";
import { CheckOutlined } from "@ant-design/icons";
import type { AppRouter } from "@api/modules/trpc/trpc.router";
import {
  Delete,
  Edit,
  Favorite,
  FavoriteBorder,
  MoreVert,
} from "@mui/icons-material";
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
} from "@mui/material";
import type { inferRouterOutputs } from "@trpc/server";
import { UUID } from "crypto";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  SiAudi,
  SiBmw,
  SiFord,
  SiHonda,
  SiMercedes,
  SiPorsche,
  SiTesla,
  SiToyota,
  SiVolkswagen,
} from "react-icons/si";
import { useAuthErrorHandler } from "../../hooks/useAuthErrorHandler";
import { useAuth } from "../../lib/auth-context";
import { trpc } from "../_trpc/client";

type RouterOutput = inferRouterOutputs<AppRouter>;
export type Car = RouterOutput["cars"]["getById"];
export type CarBrandType = RouterOutput["cars"]["getById"]["brand"];

const CAR_BRANDS: { [K in CarBrandType]: K } = {
  BMW: "BMW",
  Mercedes: "Mercedes",
  Porsche: "Porsche",
  Audi: "Audi",
  Toyota: "Toyota",
  Honda: "Honda",
  Ford: "Ford",
  Tesla: "Tesla",
  Volkswagen: "Volkswagen",
};

const TableSkeleton = ({
  showActionsColumn = false,
}: {
  showActionsColumn?: boolean;
}) => (
  <TableContainer sx={{ bgcolor: "transparent" }}>
    <Table sx={{ minWidth: 650 }}>
      <TableHead sx={{ bgcolor: "rgba(15, 23, 42, 0.6)" }}>
        <TableRow>
          {[
            { width: "80px" }, // Logo
            { width: "150px" }, // Brand
            { width: "180px" }, // Model
            { width: "100px" }, // Year
            { width: "120px" }, // Color
            { width: "140px" }, // KM Driven
            { width: "130px" }, // Price
            ...(showActionsColumn ? [{ width: "120px" }] : []),
          ].map((col, idx) => (
            <TableCell
              key={idx}
              sx={{ width: col.width, color: "rgb(148, 163, 184)" }}
            >
              <Skeleton
                variant="text"
                sx={{ bgcolor: "rgba(71, 85, 105, 0.5)" }}
              />
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {[...Array(8)].map((_, i) => (
          <TableRow key={i}>
            {[
              { width: "80px" }, // Logo
              { width: "150px" }, // Brand
              { width: "180px" }, // Model
              { width: "100px" }, // Year
              { width: "120px" }, // Color
              { width: "140px" }, // KM Driven
              { width: "130px" }, // Price
              ...(showActionsColumn ? [{ width: "120px" }] : []),
            ].map((col, idx) => (
              <TableCell key={idx} sx={{ width: col.width }}>
                <Skeleton
                  variant="text"
                  sx={{ bgcolor: "rgba(71, 85, 105, 0.5)" }}
                />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

type SortField = "brand" | "model" | "year" | "color" | "kmDriven" | "price";
type SortDirection = "asc" | "desc";

const BrandLogo = ({ brand }: { brand: CarBrandType }) => {
  const logoMap: Record<CarBrandType, React.ReactElement> = {
    BMW: (
      <Box
        sx={{
          bgcolor: "white",
          borderRadius: "50%",
          p: "4px",
          display: "flex",
        }}
      >
        <SiBmw size={20} color="#0066CC" />
      </Box>
    ),
    Mercedes: (
      <Box
        sx={{
          bgcolor: "white",
          borderRadius: "50%",
          p: "4px",
          display: "flex",
        }}
      >
        <SiMercedes size={20} color="black" />
      </Box>
    ),
    Porsche: (
      <Box
        sx={{
          bgcolor: "white",
          borderRadius: "50%",
          p: "4px",
          display: "flex",
        }}
      >
        <SiPorsche size={20} color="black" />
      </Box>
    ),
    Audi: (
      <Box
        sx={{
          bgcolor: "white",
          borderRadius: "50%",
          p: "4px",
          display: "flex",
        }}
      >
        <SiAudi size={20} color="black" />
      </Box>
    ),
    Toyota: (
      <Box
        sx={{
          bgcolor: "white",
          borderRadius: "50%",
          p: "4px",
          display: "flex",
        }}
      >
        <SiToyota size={20} color="#EB0A1E" />
      </Box>
    ),
    Honda: (
      <Box
        sx={{
          bgcolor: "white",
          borderRadius: "50%",
          p: "4px",
          display: "flex",
        }}
      >
        <SiHonda size={20} color="#CC0000" />
      </Box>
    ),
    Ford: (
      <Box
        sx={{
          bgcolor: "white",
          borderRadius: "50%",
          p: "4px",
          display: "flex",
        }}
      >
        <SiFord size={20} color="#003478" />
      </Box>
    ),
    Tesla: (
      <Box
        sx={{
          bgcolor: "white",
          borderRadius: "50%",
          p: "4px",
          display: "flex",
        }}
      >
        <SiTesla size={20} color="#CC0000" />
      </Box>
    ),
    Volkswagen: (
      <Box
        sx={{
          bgcolor: "white",
          borderRadius: "50%",
          p: "4px",
          display: "flex",
        }}
      >
        <SiVolkswagen size={20} color="#151F5D" />
      </Box>
    ),
  };

  return (
    logoMap[brand] || (
      <Box
        sx={{
          width: "28px",
          height: "28px",
          bgcolor: "rgba(148, 163, 184, 0.2)",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "12px",
          fontWeight: "bold",
          color: "rgb(148, 163, 184)",
        }}
      >
        {brand.charAt(0)}
      </Box>
    )
  );
};

export default function CarList() {
  const { user: currentUser } = useAuth();
  const { handleError } = useAuthErrorHandler();
  const [page, setPage] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<Car>>({});
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("brand");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const limit = 8;

  const { data, error, isLoading, isFetching } = trpc.cars.list.useQuery(
    {
      skip: page * limit,
      limit,
      sortField,
      sortDirection,
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh, reducing unnecessary refetches
    },
  );

  const utils = trpc.useUtils();
  const deleteCar = trpc.cars.deleteById.useMutation({
    onSuccess: (_, variables) => {
      // Find the car that was deleted from current data
      const deletedCar = data?.items.find((car) => car.id === variables.id);
      if (deletedCar) {
        toast.success(`${deletedCar.brand} ${deletedCar.model} deleted`);
      } else {
        toast.success("Car deleted");
      }
      utils.cars.list.invalidate();
    },
    onError: handleError,
  });

  const updateCar = trpc.cars.update.useMutation({
    onSuccess: (car) => {
      toast.success(`${car.brand} ${car.model} updated`);
      utils.cars.list.invalidate();
      setEditingId(null);
      setEditingData({});
    },
    onError: handleError,
  });

  const toggleFavorite = trpc.cars.toggleFavorite.useMutation({
    onSuccess: () => {
      utils.cars.list.invalidate();
    },
    onError: handleError,
  });

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleEditClick = (car: Car) => {
    setEditingId(car.id);
    setEditingData({
      brand: car.brand,
      model: car.model,
      year: car.year,
      color: car.color,
      kmDriven: car.kmDriven,
      price: car.price,
    });
  };

  const handleSaveClick = async (carId: string) => {
    if (
      editingData.brand &&
      editingData.model &&
      editingData.year &&
      editingData.color &&
      editingData.kmDriven !== undefined &&
      editingData.price !== undefined
    ) {
      await updateCar.mutateAsync({
        id: carId,
        data: editingData as Required<typeof editingData>,
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData({});
  };

  const handleSort = (field: SortField) => {
    const isAsc = sortField === field && sortDirection === "asc";
    setSortDirection(isAsc ? "desc" : "asc");
    setSortField(field);
    setPage(0); // Reset to first page when sorting changes
  };

  const sortedData = data?.items || [];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        openDropdownId &&
        !(event.target as Element)?.closest?.(".relative")
      ) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdownId]);

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-red-400 backdrop-blur-sm">
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-medium">Error:</span> {error.message}
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil((data?.meta.totalItems || 0) / limit);

  return (
    <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden w-full max-w-6xl">
      <div className="px-8 py-6 border-b border-slate-700/50 flex justify-between">
        <div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Car Inventory
          </h3>
          <p className="text-slate-400 mt-1">
            {data?.meta.totalItems || 0} cars total
          </p>
        </div>
        {isFetching && !isLoading && (
          <div className="flex items-center text-sm text-slate-400">
            <div className="w-4 h-4 border-2 border-slate-600 border-t-blue-400 rounded-full animate-spin mr-2"></div>
            Updating...
          </div>
        )}
      </div>

      <div className="relative" style={{ minHeight: "600px" }}>
        {isLoading ? (
          <TableSkeleton showActionsColumn={!!currentUser} />
        ) : data?.items.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <div className="text-6xl mb-4">🚗</div>
            <p className="text-lg font-medium">No cars found</p>
            <p className="text-sm text-slate-500 mt-2">
              Start by adding some cars to your inventory
            </p>
          </div>
        ) : (
          <TableContainer sx={{ bgcolor: "transparent" }}>
            <Table
              sx={{
                minWidth: 650,
                "& .MuiTableCell-root": {
                  borderColor: "rgba(148, 163, 184, 0.2)",
                  color: "rgb(226, 232, 240)",
                  bgcolor: "transparent",
                },
              }}
            >
              <TableHead
                sx={{
                  bgcolor: "rgba(15, 23, 42, 0.6)",
                }}
              >
                <TableRow>
                  {/* Logo Column Header */}
                  <TableCell
                    sx={{
                      color: "rgb(148, 163, 184)",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      fontSize: "0.75rem",
                      width: "80px",
                      textAlign: "center",
                    }}
                  >
                    Logo
                  </TableCell>
                  {[
                    { key: "brand", label: "Brand" },
                    { key: "model", label: "Model" },
                    { key: "year", label: "Year" },
                    { key: "color", label: "Color" },
                    { key: "kmDriven", label: "KM Driven" },
                    { key: "price", label: "Price" },
                  ].map(({ key, label }) => (
                    <TableCell
                      key={key}
                      sx={{
                        color: "rgb(148, 163, 184)",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        fontSize: "0.75rem",
                        width:
                          key === "brand"
                            ? "150px"
                            : key === "model"
                              ? "180px"
                              : key === "year"
                                ? "100px"
                                : key === "color"
                                  ? "120px"
                                  : key === "kmDriven"
                                    ? "140px"
                                    : "130px",
                      }}
                    >
                      <TableSortLabel
                        active={sortField === key}
                        direction={sortField === key ? sortDirection : "asc"}
                        onClick={() => handleSort(key as SortField)}
                        sx={{
                          color: "rgb(148, 163, 184) !important",
                          "&:hover": { color: "rgb(96, 165, 250) !important" },
                          "&.Mui-active": {
                            color: "rgb(96, 165, 250) !important",
                          },
                          "& .MuiTableSortLabel-icon": {
                            color: "rgb(96, 165, 250) !important",
                          },
                        }}
                      >
                        {label}
                      </TableSortLabel>
                    </TableCell>
                  ))}
                  {currentUser && (
                    <TableCell
                      sx={{
                        color: "rgb(148, 163, 184)",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        fontSize: "0.75rem",
                        width: "120px",
                      }}
                    >
                      Actions
                    </TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedData.map((car) => {
                  const isFavorited =
                    currentUser &&
                    car.favoritedBy.includes(currentUser.id as UUID);
                  const canEdit =
                    currentUser &&
                    (currentUser.role === "admin" ||
                      car.createdBy === currentUser.id);
                  const canDelete =
                    currentUser &&
                    (currentUser.role === "admin" ||
                      car.createdBy === currentUser.id);
                  const isEditing = editingId === car.id;

                  return (
                    <TableRow
                      key={car.id}
                      sx={{
                        transition: "all 0.2s",
                        bgcolor: isEditing
                          ? "rgba(59, 130, 246, 0.1)"
                          : "transparent",
                        border: isEditing
                          ? "2px solid rgba(59, 130, 246, 0.3)"
                          : "none",
                        "&:hover": {
                          bgcolor: isEditing
                            ? "rgba(59, 130, 246, 0.1)"
                            : "rgba(71, 85, 105, 0.3)",
                        },
                      }}
                    >
                      {/* Logo Column */}
                      <TableCell sx={{ width: "80px", textAlign: "center" }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            height: "40px",
                          }}
                        >
                          <BrandLogo brand={car.brand} />
                        </Box>
                      </TableCell>

                      {/* Brand Column */}
                      <TableCell sx={{ width: "150px" }}>
                        {isEditing ? (
                          <select
                            value={editingData.brand || ""}
                            onChange={(e) =>
                              setEditingData({
                                ...editingData,
                                brand: e.target.value as CarBrandType,
                              })
                            }
                            className="w-full px-3 py-2 border border-slate-600/50 bg-slate-700/50 text-slate-200 rounded-lg text-sm focus:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition-all duration-200"
                          >
                            <option value="">Select Brand</option>
                            {Object.values(CAR_BRANDS).map((brand) => (
                              <option key={brand} value={brand}>
                                {brand}
                              </option>
                            ))}
                          </select>
                        ) : (
                          car.brand
                        )}
                      </TableCell>

                      {/* Model Column */}
                      <TableCell sx={{ width: "180px" }}>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingData.model || ""}
                            onChange={(e) =>
                              setEditingData({
                                ...editingData,
                                model: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-slate-600/50 bg-slate-700/50 text-slate-200 rounded-lg text-sm focus:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition-all duration-200"
                            placeholder="Model"
                          />
                        ) : (
                          car.model
                        )}
                      </TableCell>

                      {/* Year Column */}
                      <TableCell sx={{ width: "100px" }}>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editingData.year || ""}
                            onChange={(e) =>
                              setEditingData({
                                ...editingData,
                                year: parseInt(e.target.value) || 0,
                              })
                            }
                            className="w-full px-3 py-2 border border-slate-600/50 bg-slate-700/50 text-slate-200 rounded-lg text-sm focus:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition-all duration-200"
                            placeholder="Year"
                            min="1886"
                            max={new Date().getFullYear() + 1}
                          />
                        ) : (
                          car.year
                        )}
                      </TableCell>

                      {/* Color Column */}
                      <TableCell sx={{ width: "120px" }}>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingData.color || ""}
                            onChange={(e) =>
                              setEditingData({
                                ...editingData,
                                color: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-slate-600/50 bg-slate-700/50 text-slate-200 rounded-lg text-sm focus:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition-all duration-200"
                            placeholder="Color"
                          />
                        ) : (
                          car.color
                        )}
                      </TableCell>

                      {/* KM Driven Column */}
                      <TableCell sx={{ width: "140px" }}>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editingData.kmDriven || ""}
                            onChange={(e) =>
                              setEditingData({
                                ...editingData,
                                kmDriven: parseInt(e.target.value) || 0,
                              })
                            }
                            className="w-full px-3 py-2 border border-slate-600/50 bg-slate-700/50 text-slate-200 rounded-lg text-sm focus:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition-all duration-200"
                            placeholder="KM Driven"
                            min="0"
                          />
                        ) : (
                          `${car.kmDriven.toLocaleString()} km`
                        )}
                      </TableCell>

                      {/* Price Column */}
                      <TableCell sx={{ width: "130px" }}>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editingData.price || ""}
                            onChange={(e) =>
                              setEditingData({
                                ...editingData,
                                price: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-full px-3 py-2 border border-slate-600/50 bg-slate-700/50 text-slate-200 rounded-lg text-sm focus:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition-all duration-200"
                            placeholder="Price"
                            min="0"
                            step="0.01"
                          />
                        ) : (
                          `${car.price.toLocaleString()}€`
                        )}
                      </TableCell>

                      {/* Actions Column */}
                      {currentUser && (
                        <TableCell sx={{ width: "120px" }}>
                          {isEditing ? (
                            <Box sx={{ display: "flex", gap: 1 }}>
                              <IconButton
                                onClick={() => handleSaveClick(car.id)}
                                disabled={updateCar.isPending}
                                sx={{
                                  color: "#4ade80",
                                  border: "1px solid rgba(34, 197, 94, 0.3)",
                                  "&:hover": {
                                    bgcolor: "rgba(34, 197, 94, 0.2)",
                                    borderColor: "rgba(34, 197, 94, 0.5)",
                                  },
                                  "&:disabled": { opacity: 0.5 },
                                }}
                              >
                                <CheckOutlined />
                              </IconButton>
                              <IconButton
                                onClick={handleCancelEdit}
                                disabled={updateCar.isPending}
                                sx={{
                                  color: "rgb(148, 163, 184)",
                                  border: "1px solid rgba(148, 163, 184, 0.3)",
                                  "&:hover": {
                                    bgcolor: "rgba(239, 68, 68, 0.2)",
                                    borderColor: "rgba(239, 68, 68, 0.5)",
                                    color: "rgb(248, 113, 113)",
                                  },
                                  "&:disabled": { opacity: 0.5 },
                                }}
                              >
                                ✕
                              </IconButton>
                            </Box>
                          ) : (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                              }}
                            >
                              {/* Heart Icon */}
                              <IconButton
                                onClick={() =>
                                  toggleFavorite.mutate({ id: car.id })
                                }
                                disabled={toggleFavorite.isPending}
                                sx={{
                                  color: isFavorited
                                    ? "#ef4444"
                                    : "rgb(148, 163, 184)",
                                  "&:hover": {
                                    color: "#ef4444",
                                    bgcolor: "rgba(239, 68, 68, 0.1)",
                                    transform: "scale(1.1)",
                                  },
                                  transition: "all 0.2s",
                                }}
                              >
                                {isFavorited ? (
                                  <Favorite />
                                ) : (
                                  <FavoriteBorder />
                                )}
                              </IconButton>

                              {/* Three Dots Menu */}
                              <IconButton
                                onClick={(event) => {
                                  setAnchorEl(event.currentTarget);
                                  setOpenDropdownId(car.id);
                                }}
                                disabled={!canEdit && !canDelete}
                                sx={{
                                  color:
                                    !canEdit && !canDelete
                                      ? "rgb(71, 85, 105)"
                                      : "rgb(148, 163, 184)",
                                  "&:hover": {
                                    color: "rgb(226, 232, 240)",
                                    bgcolor: "rgba(71, 85, 105, 0.5)",
                                  },
                                }}
                              >
                                <MoreVert />
                              </IconButton>

                              <Menu
                                anchorEl={anchorEl}
                                open={Boolean(
                                  anchorEl && openDropdownId === car.id,
                                )}
                                onClose={() => {
                                  setAnchorEl(null);
                                  setOpenDropdownId(null);
                                }}
                                sx={{
                                  "& .MuiPaper-root": {
                                    bgcolor: "rgba(15, 23, 42, 0.95)",
                                    backdropFilter: "blur(8px)",
                                    border:
                                      "1px solid rgba(148, 163, 184, 0.2)",
                                    borderRadius: "8px",
                                  },
                                  "& .MuiMenuItem-root": {
                                    color: "rgb(203, 213, 225)",
                                    "&:hover": {
                                      bgcolor: "rgba(59, 130, 246, 0.2)",
                                      color: "rgb(96, 165, 250)",
                                    },
                                  },
                                }}
                              >
                                {canEdit && (
                                  <MenuItem
                                    onClick={() => {
                                      handleEditClick(car);
                                      setAnchorEl(null);
                                      setOpenDropdownId(null);
                                    }}
                                    sx={{
                                      "&:hover": {
                                        bgcolor: "rgba(59, 130, 246, 0.2)",
                                      },
                                    }}
                                  >
                                    <Edit sx={{ mr: 2, fontSize: "1.1rem" }} />
                                    Edit
                                  </MenuItem>
                                )}
                                {canDelete && (
                                  <MenuItem
                                    onClick={() => {
                                      deleteCar.mutate({ id: car.id });
                                      setAnchorEl(null);
                                      setOpenDropdownId(null);
                                    }}
                                    disabled={deleteCar.isPending}
                                    sx={{
                                      "&:hover": {
                                        bgcolor: "rgba(239, 68, 68, 0.2)",
                                        color: "rgb(248, 113, 113)",
                                      },
                                    }}
                                  >
                                    <Delete
                                      sx={{ mr: 2, fontSize: "1.1rem" }}
                                    />
                                    Delete
                                  </MenuItem>
                                )}
                              </Menu>
                            </Box>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </div>

      {totalPages > 1 && (
        <div className="bg-slate-800/30 text-slate-300 px-6 py-4 flex items-center justify-between border-t border-slate-700/50">
          <button
            disabled={page === 0 || isFetching}
            onClick={() => handlePageChange(page - 1)}
            className="px-6 py-2 border border-slate-600/50 bg-slate-700/50 rounded-lg disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed hover:bg-slate-600/50 hover:border-slate-500/50 transition-all duration-200 font-medium"
          >
            Previous
          </button>
          <span className="text-slate-400 font-medium">
            Page <span className="text-blue-400">{page + 1}</span> of{" "}
            <span className="text-blue-400">{totalPages}</span>
          </span>
          <button
            disabled={page >= totalPages - 1 || isFetching}
            onClick={() => handlePageChange(page + 1)}
            className="px-6 py-2 border border-slate-600/50 bg-slate-700/50 rounded-lg disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed hover:bg-slate-600/50 hover:border-slate-500/50 transition-all duration-200 font-medium"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
