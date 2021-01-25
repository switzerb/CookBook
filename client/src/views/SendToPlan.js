import {
    Button,
    IconButton,
    Snackbar,
} from "@material-ui/core";
import {
    AddShoppingCart,
    ExitToApp,
} from "@material-ui/icons";
import React from "react";
import TaskStore from "../data/TaskStore";
import useStore from "../data/useStore";

const SendToPlan = ({onClick, iconOnly, withToast = true}) => {
    const [open, setOpen] = React.useState(false);
    const listLO = useStore(() => TaskStore.getActiveListLO(), TaskStore, []);
    if (!listLO.hasValue()) return null;
    const list = listLO.getValueEnforcing();
    const handleClick = () => {
        withToast && setOpen(true);
        onClick && onClick(list.id);
    };
    let result;
    if (iconOnly) {
        result = <IconButton
            size="small"
            onClick={handleClick}
            title={`Send to "${list.name}"`}
        >
            <AddShoppingCart fontSize="inherit" />
        </IconButton>;
    } else {
        result = <Button
            disableElevation
            variant="contained"
            color="secondary"
            onClick={handleClick}
            startIcon={<ExitToApp />}
        >
            <span
                style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                }}
                title={`Send to ${list.name}`}
            >
                To {list.name}
            </span>
        </Button>;
    }
    if (withToast) {
        const handleClose = (event, reason) => {
            // incantation based on docs...
            if (reason === "clickaway") {
                return;
            }
            setOpen(false);
        };

        result = <>
            {result}
            <Snackbar
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "left",
                }}
                open={open}
                autoHideDuration={6000}
                onClose={handleClose}
                message={`Sent to ${list.name}!`}
            />
        </>;
    }
    return result;
};

export default SendToPlan;
