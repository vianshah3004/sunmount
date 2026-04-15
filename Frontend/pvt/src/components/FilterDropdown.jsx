import { useEffect, useId, useMemo, useRef, useState } from 'react';

export default function FilterDropdown({
  options,
  value,
  onChange,
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef(null);
  const optionRefs = useRef([]);
  const listboxId = useId();

  const selectedIndex = useMemo(
    () => options.findIndex((option) => option.value === value),
    [options, value]
  );

  const selectedLabel = selectedIndex >= 0 ? options[selectedIndex].label : options[0]?.label ?? 'Select';

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      setActiveIndex(-1);
      return;
    }

    const nextIndex = selectedIndex >= 0 ? selectedIndex : 0;
    setActiveIndex(nextIndex);
    const rafId = window.requestAnimationFrame(() => {
      optionRefs.current[nextIndex]?.focus();
    });

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [open, selectedIndex]);

  const selectAtIndex = (index) => {
    const option = options[index];
    if (!option) {
      return;
    }
    onChange(option.value);
    setOpen(false);
  };

  const handleTriggerKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setOpen(true);
    }
  };

  const handleListKeyDown = (event) => {
    if (!options.length) {
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      rootRef.current?.querySelector('button[data-dropdown-trigger="true"]')?.focus();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => {
        const next = current < options.length - 1 ? current + 1 : 0;
        optionRefs.current[next]?.focus();
        return next;
      });
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => {
        const next = current > 0 ? current - 1 : options.length - 1;
        optionRefs.current[next]?.focus();
        return next;
      });
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      setActiveIndex(0);
      optionRefs.current[0]?.focus();
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      const last = options.length - 1;
      setActiveIndex(last);
      optionRefs.current[last]?.focus();
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectAtIndex(activeIndex >= 0 ? activeIndex : 0);
    }
  };

  return (
    <div ref={rootRef} className={`relative w-full sm:w-auto ${className}`}>
      <button
        type="button"
        data-dropdown-trigger="true"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleTriggerKeyDown}
        className="flex w-full items-center justify-between gap-2 rounded-2xl bg-surface-container-low px-3 py-2 text-left text-xs font-bold text-on-surface transition-colors hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 sm:px-4 sm:py-3 sm:text-sm"
      >
        <span className="truncate">{selectedLabel}</span>
        <span
          className={`material-symbols-outlined text-[20px] text-slate-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          expand_more
        </span>
      </button>

      <div
        className={`absolute right-0 z-20 mt-2 w-full min-w-[220px] rounded-2xl border border-outline-variant/20 bg-white/95 p-1.5 shadow-[0px_18px_40px_rgba(15,23,42,0.14)] backdrop-blur-sm transition-all duration-200 sm:w-auto ${
          open
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none -translate-y-1 opacity-0'
        }`}
      >
        <ul
          id={listboxId}
          role="listbox"
          aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
          tabIndex={-1}
          onKeyDown={handleListKeyDown}
          className="max-h-72 overflow-auto"
        >
          {options.map((option, index) => {
            const selected = option.value === value;
            const active = index === activeIndex;

            return (
              <li key={option.value} role="presentation">
                <button
                  id={`${listboxId}-option-${index}`}
                  ref={(element) => {
                    optionRefs.current[index] = element;
                  }}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => selectAtIndex(index)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`flex w-full items-center rounded-xl px-3 py-2.5 text-left text-xs font-bold transition-colors sm:px-4 sm:text-sm ${
                    selected
                      ? 'bg-primary/12 text-primary'
                      : active
                      ? 'bg-surface-container-low text-on-surface'
                      : 'text-on-surface hover:bg-surface-container-low active:bg-surface-container-high'
                  }`}
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}