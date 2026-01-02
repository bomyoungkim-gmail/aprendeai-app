export class CornellConfigDto {
  types: {
    id: string;
    label: string;
    color: string;
    tag: string;
  }[];
  
  tabs: {
    id: string;
    label: string;
    icon: string;
  }[];

  defaults: {
    viewMode: string;
    sidebarVisible: boolean;
  };
}
