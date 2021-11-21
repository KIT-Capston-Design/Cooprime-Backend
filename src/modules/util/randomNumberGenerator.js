const createRandomNumber = () => {
  const min = 100000;
  const max = 999999;
  return Math.floor(Math.random() * (max - min)) + min; //최댓값은 제외, 최솟값은 포함
};

module.exports = createRandomNumber;
