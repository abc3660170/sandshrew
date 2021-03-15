import axios from "axios";
export default {
  methods: {
    getAxios() {
      return axios.create({
        baseURL: `${location.protocol}//${location.hostname}:3000`,
      });
    },
  },
};
