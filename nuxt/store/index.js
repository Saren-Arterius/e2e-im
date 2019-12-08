export const state = () => ({
  sidebar: false,
  eventInfo: null
});

export const mutations = {
  toggleSidebar (state) {
    state.sidebar = !state.sidebar;
  },
  setEventInfo (state, eventInfo) {
    state.eventInfo = eventInfo;
  }
};
