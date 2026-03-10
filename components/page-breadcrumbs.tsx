import React from "react";
import Link from "next/link";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Crumb {
  label: string;
  href?: string;
}

interface PageBreadcrumbsProps {
  crumbs: Crumb[];
  className?: string;
}

export function PageBreadcrumbs({ crumbs, className }: PageBreadcrumbsProps) {
  if (crumbs.length === 0) return null;

  // On mobile, collapse middle crumbs when there are 3+ items
  const shouldCollapse = crumbs.length > 2;
  const lastCrumb = crumbs[crumbs.length - 1];
  const middleCrumbs = crumbs.slice(1, -1);

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList className="flex-nowrap">
        {/* Full breadcrumbs on md+ screens */}
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          const isMiddle = index > 0 && !isLast;
          const hideOnMobile = shouldCollapse && isMiddle;

          return (
            <React.Fragment key={crumb.href ?? crumb.label}>
              <BreadcrumbItem
                className={hideOnMobile ? "hidden md:inline-flex" : undefined}
              >
                {isLast || !crumb.href ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && (
                <BreadcrumbSeparator
                  className={
                    shouldCollapse && isMiddle
                      ? "hidden md:list-item"
                      : // Hide separator after first crumb on mobile when collapsing
                        // (ellipsis will follow instead)
                        shouldCollapse && index === 0
                        ? "hidden md:list-item"
                        : undefined
                  }
                />
              )}
            </React.Fragment>
          );
        })}

        {/* Collapsed ellipsis on small screens */}
        {shouldCollapse && (
          <>
            <BreadcrumbSeparator className="md:hidden" />
            <BreadcrumbItem className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1">
                  <BreadcrumbEllipsis />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {middleCrumbs.map((crumb) => (
                    <DropdownMenuItem key={crumb.href ?? crumb.label} asChild>
                      {crumb.href ? (
                        <Link href={crumb.href}>{crumb.label}</Link>
                      ) : (
                        <span>{crumb.label}</span>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="md:hidden" />
            <BreadcrumbItem className="md:hidden">
              {lastCrumb.href ? (
                <BreadcrumbLink asChild>
                  <Link href={lastCrumb.href}>{lastCrumb.label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{lastCrumb.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
