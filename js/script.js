const MAX_DECIMAL_PLACES = 2;

// -------------------------------------------------------------------------------------------------------- //

const {sin, cos, tan, sqrt, PI} = Math;
const rad = deg => deg * PI / 180;

// -------------------------------------------------------------------------------------------------------- //

// import Swiper from 'swiper' // fix Swiper IDE warns

const pages = new Swiper('.main__container', {
    direction: 'vertical',
    speed: 600,
    slidesPerView: 1,
    // effect: 'flip',
    spaceBetween: 0,
    mousewheel: false,
    simulateTouch: false, // must be false always
    allowTouchMove: false,
    keyboard: false,
    touchStartPreventDefault: false,
});

// -------------------------------------------------------------------------------------------------------- //

let sliderChangeAllowed = false;

function allowSliderChange() {
    pages.params.allowTouchMove = true;

    pages.params.mousewheel.enabled = true;
    pages.mousewheel.enable();

    pages.params.keyboard.enabled = true;
    pages.keyboard.enable();

    pages.update();

    sliderChangeAllowed = true;
}

// -------------------------------------------------------------------------------------------------------- //

const timeBar = document.querySelector('.time-slider');

noUiSlider.create(timeBar, {
    start: 0,
    connect: [true, false],
    step: 10 ** -MAX_DECIMAL_PLACES,
    range: {'min': 0, 'max': 0}
});

// -------------------------------------------------------------------------------------------------------- //

const zip = (keys, vals) => keys.map((k, i) => [k, vals[i]]);
const listToDict = (keys, vals) => Object.fromEntries(zip(keys, vals));

// -------------------------------------------------------------------------------------------------------- //

const getTIFValue = field => parseFloat(field.value);
const getCIFValue = field => field.checked;

const updateIFState = (field, invalid) => field.closest('.input__item').classList.toggle('failed', invalid);

const getLFValue = field => parseFloat(field.textContent);
const setLFValue = (field, val) => field.textContent = parseFloat(val).toFixed(MAX_DECIMAL_PLACES);

// -------------------------------------------------------------------------------------------------------- //

const TIKList = ['a', 'M', 'm', 'v0', 'g', 'h', 'V'];
const CIK = 'aw';

const IKList = [...TIKList, CIK];
const LKList = ['X', 'Y', 'T', 't', 'v', 'vx', 'vy', 'u', 'L', 'H', 'k'];

const TIFList = document.querySelectorAll('.text-field');
const CIF = document.querySelector('.checkbox');

const IFList = [...TIFList, CIF];
const LFList = document.querySelectorAll('.log-field');

const inp = listToDict(IKList, IFList);
const log = listToDict(LKList, LFList);

// -------------------------------------------------------------------------------------------------------- //

const createValidateFunction = (val, cond) => new Function(val, `return ${cond}`);

const TIFCList = Array.from(document.querySelectorAll('.constraint')).map(val => val.textContent);
const TIFVList = TIKList.map((val, i) => createValidateFunction(val, TIFCList[i]));

const TIFValidate = listToDict(TIKList, TIFVList);

// -------------------------------------------------------------------------------------------------------- //

function filterNumChars(event) {
    const tf = event.target;

    const value = tf.value;
    const last = tf.selectionStart - 1;

    if (!/^-?\d*[.,]?\d*$/.test(value)) tf.value = value.slice(0, last) + value.slice(last + 1);
    else updateIFState(tf, false);
}

TIFList.forEach(tf => {
    tf.addEventListener('input', filterNumChars);
    tf.addEventListener('paste', event => event.preventDefault());
});

// -------------------------------------------------------------------------------------------------------- //

function validateTIF() {
    let res = true;

    for (const key of TIKList) {
        const IF = inp[key];
        const validate = TIFValidate[key];

        const isValid = validate(getTIFValue(IF));

        updateIFState(IF, !isValid);

        res &&= isValid;
    }

    return res;
}

// -------------------------------------------------------------------------------------------------------- //

function singleLFCalc() {
    const a = rad(getTIFValue(inp.a));
    const v0 = getTIFValue(inp.v0)
    const h = getTIFValue(inp.h);
    const g = getTIFValue(inp.g);

    const vx = v0 * cos(a);
    const vy = v0 * sin(a);

    const T = (vy + sqrt(vy ** 2 + 2 * g * h)) / g;

    setLFValue(log.vx, vx);

    setLFValue(log.T, T);
    timeLFInit();

    setLFValue(log.L, vx * T);
    setLFValue(log.H, h + vy ** 2 / (2 * g));
}

function regularLFCalc(t = 0) {
    const a = rad(getTIFValue(inp.a));
    const v0 = getTIFValue(inp.v0);
    const h = getTIFValue(inp.h);
    const g = getTIFValue(inp.g);

    const vx = getLFValue(log.vx);
    const vy = v0 * sin(a) - g * t;

    const x = vx * t;

    setLFValue(log.t, t);

    setLFValue(log.vy, vy);
    setLFValue(log.v, sqrt(vx ** 2 + vy ** 2));

    setLFValue(log.X, x);
    setLFValue(log.Y, h + v0 * sin(a) * t - g * t ** 2 / 2);

    setLFValue(log.k, g / vx ** 2 / (1 + (tan(a) - g * x / vx ** 2) ** 2) ** 1.5);
}

// -------------------------------------------------------------------------------------------------------- //

const timeLFInit = () => timeBar.noUiSlider.updateOptions({start: [0], range: {min: 0, max: getLFValue(log.T)}});

const timeBarUpdate = (vals, handle) => regularLFCalc(vals[handle]);

const allowTimeBarUpdate = () => timeBar.noUiSlider.on('update', timeBarUpdate);
const refuseTimeBarUpdate = () => timeBar.noUiSlider.off('update', timeBarUpdate);

// -------------------------------------------------------------------------------------------------------- //

function generate() {
    if (!validateTIF()) return;

    if (!sliderChangeAllowed) allowSliderChange();

    refuseTimeBarUpdate();

    singleLFCalc();
    regularLFCalc();

    allowTimeBarUpdate();

    pages.slideNext();
}

const genBtn = document.querySelector('.generate');
genBtn.addEventListener('click', generate);

// -------------------------------------------------------------------------------------------------------- //