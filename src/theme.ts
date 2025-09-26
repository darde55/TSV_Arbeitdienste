import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: { main: "#B71C1C" }, // TSV-Rot
    secondary: { main: "#212121" }, // Dunkelgrau
    background: { default: "#f9f9f9" },
  },
  typography: {
    fontFamily: "Montserrat, Roboto, Arial, sans-serif",
    h5: { fontWeight: 700 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 20 },
      },
    },
  },
});

export default theme;