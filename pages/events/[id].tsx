import { SpecialEventRegistrationDialogContent } from '@/components/specialEventRegistrationDialog';
import { useRouter } from 'next/router';

export default function SpecialEventPage({ id }: { id: string }) {
  const router = useRouter();

  const handleClose = () => {
    router.push('/#musik');
  };

  return (
    <div className="w-full px-3">
      <SpecialEventRegistrationDialogContent
        id={id}
        handleClose={handleClose}
      />
    </div>
  );
}

export async function getServerSideProps(context: { params: { id: string } }) {
  const { id } = context.params;
  return {
    props: {
      id,
    },
  };
}
