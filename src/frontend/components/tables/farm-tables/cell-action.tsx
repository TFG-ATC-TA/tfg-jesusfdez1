'use client';
import { Button } from '@/components/ui/button';
import { Farm } from '@/types';
import { ExternalLink} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CellActionProps {
  data: Farm;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();

  return (
    <>

          <Button  className="h-6 w-12 p-0 flex items-center"   onClick={() => router.push(`/farms/${data.idname}`)}>
            <ExternalLink className="h-4 w-4" />
          </Button>

    </>
  );
};
