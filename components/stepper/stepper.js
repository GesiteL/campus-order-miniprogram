Component({
  properties: {
    count: { type: Number, value: 0 },
    food: { type: Object, value: null }
  },
  methods: {
    onMinus() {
      this.triggerEvent('change', {
        type: 'minus',
        id: this.properties.food.id,
        food: this.properties.food
      });
    },
    onPlus() {
      this.triggerEvent('change', {
        type: 'plus',
        id: this.properties.food.id,
        food: this.properties.food
      });
    }
  }
});
