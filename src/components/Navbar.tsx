import React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import SportsHandballIcon from "@mui/icons-material/SportsHandball";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../store/userStore";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

const Navbar: React.FC = () => {
  const { user, logout } = useUserStore();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => setAnchorEl(null);

  const go = (route: string) => {
    navigate(route);
    handleClose();
  };

  return (
    <AppBar position="sticky" color="primary" sx={{ mb: 2 }}>
      <Toolbar>
        <SportsHandballIcon sx={{ mr: 1 }} />
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
          TSV Wolfschlugen
        </Typography>
        {isMobile ? (
          <>
            <IconButton color="inherit" onClick={handleMenu}>
              <MenuIcon />
            </IconButton>
            <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={handleClose}>
              {user ? (
                <>
                  <MenuItem onClick={() => go("/")}>Termine</MenuItem>
                  <MenuItem onClick={() => go("/profile")}>Profil</MenuItem>
                  {user.role === "admin" && (
                    <MenuItem onClick={() => go("/admin")}>Admin</MenuItem>
                  )}
                  <MenuItem
                    onClick={() => {
                      logout();
                      go("/login");
                    }}
                  >
                    Logout
                  </MenuItem>
                </>
              ) : (
                <MenuItem onClick={() => go("/login")}>Login</MenuItem>
              )}
            </Menu>
          </>
        ) : (
          <>
            {user ? (
              <>
                <Button color="inherit" onClick={() => go("/")}>
                  Termine
                </Button>
                <Button color="inherit" onClick={() => go("/profile")}>
                  Profil
                </Button>
                {user.role === "admin" && (
                  <Button color="inherit" onClick={() => go("/admin")}>
                    Admin
                  </Button>
                )}
                <Button color="inherit" onClick={() => { logout(); go("/login"); }}>
                  Logout
                </Button>
              </>
            ) : (
              <Button color="inherit" onClick={() => go("/login")}>
                Login
              </Button>
            )}
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;