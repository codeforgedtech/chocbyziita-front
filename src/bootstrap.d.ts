interface BootstrapToast {
    show: () => void;
  }
  
  interface Bootstrap {
    Toast: new (element: HTMLElement) => BootstrapToast;
  }
  
  interface Window {
    bootstrap: Bootstrap;
  }
  