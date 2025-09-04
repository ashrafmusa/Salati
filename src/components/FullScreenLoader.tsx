import React from 'react';
import { SpinnerIcon } from '../assets/icons';

const FullScreenLoader: React.FC = () => (
  <div className="flex items-center justify-center h-screen w-full bg-warmBeige dark:bg-slate-950">
    <SpinnerIcon className="w-12 h-12 text-primary animate-spin" />
  </div>
);

export default FullScreenLoader;