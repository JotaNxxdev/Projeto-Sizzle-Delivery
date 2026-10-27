import type { HTMLAttributes } from 'react';

type Padding = 'none' | 'sm' | 'md' | 'lg';

interface Props extends HTMLAttributes<HTMLDivElement> {
  padding?: Padding;
  interactive?: boolean;
}

export default function Card({ padding = 'md', interactive = false, className, children, ...rest }: Props) {
  const classes = ['ui-card', `ui-card-pad-${padding}`, interactive ? 'ui-card-interactive' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}
