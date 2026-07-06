import React from 'react';
import { Card, CardBody, Chip } from "@heroui/react";

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend: string;
}

export function StatCard({ label, value, icon, trend }: StatCardProps) {
  return (
    <Card className="p-4 shadow-sm border-none bg-white">
      <CardBody>
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center">
            {icon}
          </div>
          <Chip size="sm" variant="flat" color="success" className="font-bold">
            {trend}
          </Chip>
        </div>
        <p className="text-sm font-bold text-default-500 mb-1">{label}</p>
        <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
      </CardBody>
    </Card>
  );
}
