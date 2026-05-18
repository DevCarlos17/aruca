import { cn } from '../../lib/utils'

export function TableRoot({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('w-full overflow-auto rounded-lg border border-border', className)}>
      <table className="w-full text-sm">{children}</table>
    </div>
  )
}

export function TableHead({ className, children }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={cn('bg-muted/50 border-b border-border', className)}>
      {children}
    </thead>
  )
}

export function TableBody({ className, children }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('divide-y divide-border', className)}>{children}</tbody>
}

export function TableRow({ className, children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cn('hover:bg-muted/30 transition-colors', className)} {...props}>
      {children}
    </tr>
  )
}

export function TableHeader({ className, children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn('px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide', className)}
      {...props}
    >
      {children}
    </th>
  )
}

export function TableCell({ className, children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn('px-4 py-3 text-foreground', className)} {...props}>
      {children}
    </td>
  )
}
