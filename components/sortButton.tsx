import { Menu, MenuItem } from '@mui/material';
import { useState } from 'react';
import SortIcon from '@mui/icons-material/Sort';

export default function SortButton<Option extends string>({
  options,
  onChange,
  defaultSelected,
}: {
  options: Option[];
  onChange: (opt: Option) => void;
  defaultSelected?: Option;
}) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selected, setSelected] = useState(defaultSelected);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const select = (o: Option) => {
    setSelected(o);
    onChange(o);
    handleClose();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <button onClick={handleClick} className="text-lg flex items-center gap-1">
        <SortIcon fontSize="inherit" />
        <span>Sortieren nach</span>
      </button>
      <Menu
        id="sort-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        {options.map((o) => (
          <MenuItem selected={selected === o} onClick={() => select(o)}>
            {o}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
