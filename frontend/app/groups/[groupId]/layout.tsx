import { GroupProvider } from '@/contexts/GroupContext';

interface GroupLayoutProps {
  children: React.ReactNode;
  params: {
    groupId: string;
  };
}

export default function GroupLayout({ children, params }: GroupLayoutProps) {
  return (
    <GroupProvider groupId={params.groupId}>
      {children}
    </GroupProvider>
  );
}
